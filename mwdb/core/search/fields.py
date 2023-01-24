import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, List, Tuple, Type, Union

from dateutil.relativedelta import relativedelta
from flask import g
from luqum.tree import Phrase, Range, Term, Word
from sqlalchemy import String, Text, and_, cast, column, exists, func, or_, select
from sqlalchemy.dialects.postgresql.json import JSONPATH_ASTEXT

from mwdb.core.capabilities import Capabilities
from mwdb.model import (
    Attribute,
    AttributeDefinition,
    Config,
    File,
    Group,
    Member,
    Object,
    ObjectPermission,
    TextBlob,
    User,
    db,
)

from .exceptions import (
    FieldNotQueryableException,
    ObjectNotFoundException,
    UnsupportedGrammarException,
)
from .tree import Subquery

Expression = Union[Range, Term]


def get_term_value(node: Term) -> str:
    """
    Retrieves unescaped value from Term with transformed wildcards
    to the SQL form
    :param node: luqum.Term object
    :return: Unescaped value
    """
    if node.has_wildcard():
        wildcard_map = {"*": "%", "?": "_"}

        # Escape already contained SQL wildcards
        node_value = re.sub(r"([%_])", r"\\\1", node.value)
        # Transform unescaped Lucene wildcards to SQL form
        node_value = Term.WILDCARDS_PATTERN.sub(
            lambda m: wildcard_map[m.group(0)], node_value
        )
        # Unescape Lucene escaped special characters
        node_value = Term.WORD_ESCAPED_CHARS.sub(r"\1", node_value)
        return node_value
    else:
        return node.unescaped_value


def make_jsonpath(field_path: List[Tuple[str, int]]) -> str:
    """
    Makes jsonpath from field path
    key.array*.child => $."key"."array"[*]."child"
    """

    def jsonpath_quote(field):
        """Quotes field to be correctly represented in jsonpath"""
        # Escape all double quotes and backslashes
        field = re.sub(r'(["\\])', r"\\\1", field)
        return f'"{field}"'

    _, root_asterisks = field_path[0]
    root = "$" + ("[*]" * root_asterisks)
    return ".".join(
        [root]
        + [
            jsonpath_quote(field) + ("[*]" * asterisks)
            for field, asterisks in field_path[1:]
        ]
    )


def make_jsonpath_range_query(jsonpath: str, expression: Range) -> str:
    conditions = []

    def ensure_number(value):
        if value.isdigit():
            return value
        else:
            match = re.match(r"\d+(?:[.]\d+)?", value)
            if not match:
                raise UnsupportedGrammarException("Invalid range value")
            return value

    if expression.low.value != "*":
        operator = ">=" if expression.include_low else ">"
        conditions.append(f"@ {operator} {ensure_number(expression.low.value)}")
    if expression.high.value != "*":
        operator = "<=" if expression.include_high else "<"
        conditions.append(f"@ {operator} {ensure_number(expression.high.value)}")
    if not conditions:
        # Handle [* TO *]
        return jsonpath
    return f'{jsonpath} ? ({" && ".join(conditions)})'


def add_escaping_for_like_statement(statement: str) -> str:
    """
    Formats query value to work properly with LIKE statements
    LIKE statements use escaping (default symbol is '\')
    Every escape should be doubled except '%' and '_'
    """
    statement = re.sub(r"\\(?![%_])", r"\\\\", statement)
    return statement


class BaseField:
    accepts_range = False
    accepts_subquery = False
    accepts_subfields = False
    accepts_wildcards = False

    def __init__(self, column):
        self.column = column

    @property
    def field_type(self) -> Type[Object]:
        return self.column.class_

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        raise NotImplementedError

    def get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        if not self.accepts_subfields and len(subfields) > 1:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: "
                f"{'.'.join([field for field, _ in subfields[1:]])}"
            )
        if (
            not self.accepts_wildcards
            and isinstance(expression, Term)
            and expression.has_wildcard()
        ):
            raise UnsupportedGrammarException(
                "Wildcards are not allowed for this field"
            )
        return self._get_condition(expression, subfields)


class StringField(BaseField):
    accepts_wildcards = True

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        value = get_term_value(expression)
        if expression.has_wildcard():
            value = add_escaping_for_like_statement(value)
            return self.column.like(value)
        else:
            return self.column == value


class SizeField(BaseField):
    accepts_range = True
    accepts_wildcards = True

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        units = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3}

        def parse_size(size):
            if size.isdigit():
                return size
            else:
                size = re.match(r"(\d+(?:[.]\d+)?)[ ]?([KMGT]?B)", size.upper())
                if size is None:
                    raise UnsupportedGrammarException("Invalid size value")
                number, unit = size.groups()
                return int(float(number) * units[unit])

        if isinstance(expression, Range):
            low_value = expression.low.value
            high_value = expression.high.value

            if low_value != "*":
                low_value = parse_size(low_value)
            if high_value != "*":
                high_value = parse_size(high_value)

            low_condition = (
                self.column >= low_value
                if expression.include_low
                else self.column > low_value
            )
            high_condition = (
                self.column <= high_value
                if expression.include_high
                else self.column < high_value
            )

            if high_value == "*" and low_value == "*":
                return True
            if high_value == "*":
                return low_condition
            if low_value == "*":
                return high_condition

            return and_(low_condition, high_condition)
        else:
            target_value = parse_size(expression.value)
            return self.column == target_value


class ListField(BaseField):
    accepts_wildcards = True

    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        value = get_term_value(expression)

        if expression.has_wildcard():
            value = add_escaping_for_like_statement(value)
            return self.column.any(self.value_column.like(value))
        else:
            return self.column.any(self.value_column == value)


class UUIDField(BaseField):
    accepts_wildcards = True

    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        value = get_term_value(expression)

        if expression.has_wildcard():
            value = add_escaping_for_like_statement(value)
            return self.column.any(cast(self.value_column, String).like(value))

        try:
            uuid_value = uuid.UUID(value)
        except ValueError:
            raise UnsupportedGrammarException("Field accepts only correct UUID values")

        return self.column.any(self.value_column == uuid_value)


class FavoritesField(BaseField):
    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        value = get_term_value(expression)

        if (
            not g.auth_user.has_rights(Capabilities.manage_users)
            and g.auth_user.login != value
        ):
            raise ObjectNotFoundException(
                "Only the mwdb admin can search for other users favorites"
            )

        if g.auth_user.login == value:
            user = g.auth_user
        else:
            user = db.session.query(User).filter(User.login == value).first()

        if user is None:
            raise ObjectNotFoundException(f"No such user: {value}")

        return self.column.any(User.id == user.id)


class AttributeField(BaseField):
    accepts_range = True
    accepts_subfields = True
    accepts_wildcards = True

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        if len(subfields) <= 1:
            raise UnsupportedGrammarException(
                "Missing attribute key (attribute.<key>:)"
            )

        attribute_key, _ = subfields[1]
        attribute_definition = AttributeDefinition.query_for_read(
            key=attribute_key, include_hidden=True
        ).first()

        if attribute_definition is None:
            raise ObjectNotFoundException(f"No such attribute: {attribute_key}")

        if (
            attribute_definition.hidden
            and (type(expression) is Range or expression.has_wildcard())
            and not g.auth_user.has_rights(Capabilities.reading_all_attributes)
        ):
            raise FieldNotQueryableException(
                "Wildcards and ranges are not allowed for hidden attributes"
            )

        json_path = make_jsonpath(subfields[1:])
        if type(expression) is Range:
            json_query_path = make_jsonpath_range_query(json_path, expression)
            value_condition = exists(
                select([1]).select_from(
                    func.jsonb_path_query(Attribute.value, json_query_path)
                )
            )
        else:
            value = get_term_value(expression)
            # Make aliased function call
            json_elements = func.jsonb_path_query(Attribute.value, json_path).alias(
                "json_element"
            )
            # Use #>>'{}' to extract value as text
            json_element = column("json_element").operate(
                JSONPATH_ASTEXT, "{}", result_type=Text
            )
            if expression.has_wildcard():
                value = add_escaping_for_like_statement(value)
                condition = json_element.like(value)
            else:
                condition = json_element == value
            value_condition = exists(
                select([1]).select_from(json_elements).where(condition)
            )
        return self.column.any(and_(Attribute.key == attribute_key, value_condition))


class ShareField(BaseField):
    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        value = expression.unescaped_value

        group = db.session.query(Group).filter(Group.name == value).first()
        if group is None:
            raise ObjectNotFoundException(f"No such group: {value}")

        group_id = group.id
        if not g.auth_user.has_rights(Capabilities.manage_users) and group_id not in [
            group.id for group in g.auth_user.groups
        ]:
            raise ObjectNotFoundException(f"No such group: {value}")

        return self.column.any(ObjectPermission.group_id == group_id)


class SharerField(BaseField):
    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        value = expression.unescaped_value

        if (
            g.auth_user.has_rights(Capabilities.manage_users)
            or g.auth_user.has_rights(Capabilities.sharing_with_all)
            or g.auth_user.has_rights(Capabilities.access_uploader_info)
        ):
            uploaders = (
                db.session.query(User)
                .join(User.memberships)
                .join(Member.group)
                .filter(Group.name == value)
            ).all()
        else:
            uploaders = (
                db.session.query(User)
                .join(User.memberships)
                .join(Member.group)
                .filter(
                    and_(g.auth_user.is_member(Group.id), Group.workspace.is_(True))
                )
                .filter(or_(Group.name == value, User.login == value))
            ).all()
        if not uploaders:
            raise ObjectNotFoundException(f"No such user or group: {value}")

        uploader_ids = [u.id for u in uploaders]
        return self.column.any(
            and_(
                ObjectPermission.get_shares_filter(include_inherited_uploads=False),
                ObjectPermission.related_user_id.in_(uploader_ids),
            )
        )


class UploaderField(BaseField):
    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        value = expression.unescaped_value
        if value == "public":
            raise ObjectNotFoundException(
                "uploader:public is no-op, all uploaders are in public group"
            )

        if (
            g.auth_user.has_rights(Capabilities.manage_users)
            or g.auth_user.has_rights(Capabilities.sharing_with_all)
            or g.auth_user.has_rights(Capabilities.access_uploader_info)
        ):
            uploaders = (
                db.session.query(User)
                .join(User.memberships)
                .join(Member.group)
                .filter(Group.name == value)
            ).all()
        else:
            uploaders = (
                db.session.query(User)
                .join(User.memberships)
                .join(Member.group)
                .filter(
                    and_(g.auth_user.is_member(Group.id), Group.workspace.is_(True))
                )
                .filter(or_(Group.name == value, User.login == value))
            ).all()
        if not uploaders:
            raise ObjectNotFoundException(f"No such user or group: {value}")

        uploader_ids = [u.id for u in uploaders]
        return self.column.any(
            and_(
                ObjectPermission.get_uploaders_filter(),
                ObjectPermission.related_user_id.in_(uploader_ids),
            )
        )


class JSONField(BaseField):
    accepts_range = True
    accepts_subfields = True
    accepts_wildcards = True

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        """
        Target query:
            select cfg from static_config
            where ... exists(
                select 1
                from jsonb_path_query(cfg, '$."indirect"."strings"[*]."a"')
                as json_element
                where json_element  #>> '{}' like '2'
            );
        """

        # Cfg values in DataBase are escaped, so we need to escape search phrase too
        if isinstance(expression, (Phrase, Word)):
            expression.value = expression.value.encode("unicode_escape").decode("utf-8")

        json_path = make_jsonpath(subfields)
        if type(expression) is Range:
            json_query_path = make_jsonpath_range_query(json_path, expression)
            return exists(
                select([1]).select_from(
                    func.jsonb_path_query(self.column, json_query_path)
                )
            )
        else:
            value = get_term_value(expression)
            # Make aliased function call
            json_elements = func.jsonb_path_query(self.column, json_path).alias(
                "json_element"
            )
            # Use #>>'{}' to extract value as text
            json_element = column("json_element").operate(
                JSONPATH_ASTEXT, "{}", result_type=Text
            )
            if expression.has_wildcard():
                value = add_escaping_for_like_statement(value)
                # chars " are not double escaped by mwdb.core.util.config_encode()
                # remove unnecessary escaping in query
                value = value.replace('\\"', '"')
                condition = json_element.like(value)

                # if json_path doesn't contain exact path
                # value extracted by #>> contains additional escaping and {} brackets
                # add char escaping again and {} brackets to match the extracted value
                value = add_escaping_for_like_statement(value)
                value = "{" + value + "}"
                condition = or_(condition, json_element.like(value))
            else:
                # remove unnecessary escaping in query
                value = value.replace('\\"', '"')
                condition = json_element == value

            return exists(select([1]).select_from(json_elements).where(condition))


class DatetimeField(BaseField):
    accepts_range = True

    def _is_relative_time(self, expression_value):
        pattern = r"^(\d+[yYmWwDdHhMSs])+$"
        return re.search(pattern, expression_value)

    def _get_field_for_unit(self, unit):
        if unit in ["y", "Y"]:
            unit = "years"
        elif unit in ["m"]:
            unit = "months"
        elif unit in ["W", "w"]:
            unit = "weeks"
        elif unit in ["D", "d"]:
            unit = "days"
        elif unit in ["H", "h"]:
            unit = "hours"
        elif unit in ["M"]:
            unit = "minutes"
        elif unit in ["S", "s"]:
            unit = "seconds"
        else:
            raise UnsupportedGrammarException("Invalid date-time format")
        return unit

    def _get_border_time(self, expression_value):
        pattern = r"(\d+)([yYmWwDdHhMSs])"
        conditions = re.findall(pattern, expression_value)
        delta_dict = {}
        for value, unit in conditions:
            field = self._get_field_for_unit(unit)
            if field not in delta_dict.keys():
                delta_dict.update({field: int(value)})
        border_time = datetime.now(tz=timezone.utc) - relativedelta(**delta_dict)
        return border_time

    def _get_date_range(self, date_node):
        formats = [
            ("%Y-%m-%d %H:%M", timedelta(minutes=1)),
            ("%Y-%m-%d %H:%M:%S", timedelta(seconds=1)),
            ("%Y-%m-%d", timedelta(days=1)),
        ]
        date_string = date_node.value

        for fmt, range_offs in formats:
            try:
                timestamp = datetime.strptime(date_string, fmt)
                return timestamp, timestamp + range_offs
            except ValueError:
                continue
        else:
            raise FieldNotQueryableException(
                f"Unsupported date-time format ({date_string})"
            )

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        if isinstance(expression, Range):
            if expression.high.value != "*" and not expression.include_high:
                raise UnsupportedGrammarException(
                    "Exclusive range is not allowed for date-time field"
                )
            if expression.low.value != "*" and not expression.include_low:
                raise UnsupportedGrammarException(
                    "Exclusive range is not allowed for date-time field"
                )
            if expression.low.value == "*" and expression.high.value == "*":
                return True
            if expression.low.value == "*":
                if self._is_relative_time(expression.high.value):
                    high = self._get_border_time(expression.high.value)
                else:
                    high = self._get_date_range(expression.high)[1]
                return self.column < high
            if expression.high.value == "*":
                if self._is_relative_time(expression.low.value):
                    low = self._get_border_time(expression.low.value)
                else:
                    low = self._get_date_range(expression.low)[0]
                return self.column >= low
            if self._is_relative_time(expression.low.value):
                low = self._get_border_time(expression.low.value)
            else:
                low = self._get_date_range(expression.low)[0]
            if self._is_relative_time(expression.high.value):
                high = self._get_border_time(expression.high.value)
            else:
                high = self._get_date_range(expression.high)[1]
        else:
            low, high = self._get_date_range(expression)

        return and_(self.column >= low, self.column < high)


class RelationField(BaseField):
    accepts_subquery = True

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        if not isinstance(expression, Subquery):
            raise UnsupportedGrammarException(
                "Only subquery is allowed for relation field"
            )
        return self.column.any(Object.id.in_(expression.subquery))


class CommentAuthorField(BaseField):
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        value = get_term_value(expression)

        user = db.session.query(User).filter(User.login == value).first()
        if user is None:
            raise ObjectNotFoundException(f"No such user: {value}")

        return self.column.any(self.value_column == value)


class UploadCountField(BaseField):
    accepts_range = True

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        def parse_upload_value(value):
            try:
                value = int(value)
                if value <= 0:
                    raise ValueError
            except ValueError:
                raise UnsupportedGrammarException(
                    "Field upload_count accepts statements with "
                    "only correct positive integer values"
                )
            return value

        if isinstance(expression, Range):
            low_value = expression.low.value
            high_value = expression.high.value

            if low_value != "*":
                low_value = parse_upload_value(low_value)
            if high_value != "*":
                high_value = parse_upload_value(high_value)

            low_condition = (
                self.column >= low_value
                if expression.include_low
                else self.column > low_value
            )
            high_condition = (
                self.column <= high_value
                if expression.include_high
                else self.column < high_value
            )

            if high_value == "*" and low_value == "*":
                return True
            if high_value == "*":
                return low_condition
            if low_value == "*":
                return high_condition

            return and_(low_condition, high_condition)
        else:
            upload_value = parse_upload_value(expression.value)
            return self.column == upload_value


class MultiField(BaseField):
    @staticmethod
    def get_column(queried_type: Type[Object], value: str):
        if queried_type is File:
            if re.match(r"^[0-9a-fA-F]{8}$", value):
                return File.crc32
            elif re.match(r"^[0-9a-fA-F]{32}$", value):
                return File.md5
            elif re.match(r"^[0-9a-fA-F]{40}$", value):
                return File.sha1
            elif re.match(r"^[0-9a-fA-F]{64}$", value):
                return File.sha256
            elif re.match(r"^[0-9a-fA-F]{128}$", value):
                return File.sha512
            else:
                raise ObjectNotFoundException(f"{value} is not valid hash value")
        elif queried_type is TextBlob:
            if re.match(r"^[0-9a-fA-F]{64}$", value):
                return TextBlob.dhash
            else:
                return TextBlob._content
        elif queried_type is Config:
            if re.match(r"^[0-9a-fA-F]{64}$", value):
                return Config.dhash
            else:
                return Config._cfg
        else:
            raise ObjectNotFoundException(
                f"{queried_type.__name__} is not valid data type"
            )

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        string_column = ["TextBlob._content"]
        json_column = ["Config._cfg"]

        value = get_term_value(expression).strip()
        values_list = re.split("\\s+", value)

        condition = None
        for value in values_list:
            column = MultiField.get_column(self.field_type, value)

            if str(column) in string_column:
                value = f"%{value}%"
                value = add_escaping_for_like_statement(value)
                condition = or_(condition, (column.like(value)))
            elif str(column) in json_column:
                value = f"%{value}%"
                value = add_escaping_for_like_statement(value)
                condition = or_(condition, (cast(column, String).like(value)))
            else:
                # hashes values
                condition = or_(condition, (column == value))

        return condition


class FileNameField(BaseField):
    accepts_wildcards = True

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        value = get_term_value(expression)

        if expression.has_wildcard():
            sub_query = db.session.query(
                File.id.label("f_id"), func.unnest(File.alt_names).label("alt_name")
            ).subquery()
            value = add_escaping_for_like_statement(value)
            file_id_matching = (
                db.session.query(File.id)
                .join(sub_query, sub_query.c.f_id == File.id)
                .filter(sub_query.c.alt_name.like(value))
            )

            condition = or_(self.column.like(value), File.id.in_(file_id_matching))
        else:
            condition = or_((self.column == value), File.alt_names.any(value))
        return condition
