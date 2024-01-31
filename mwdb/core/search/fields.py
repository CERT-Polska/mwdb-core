import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional, Tuple, Type

from dateutil.relativedelta import relativedelta
from flask import g
from luqum.tree import Item, Phrase, Range, Term, Word
from sqlalchemy import String, and_, cast, func, or_

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
from .parse_helpers import (
    PathSelector,
    has_wildcard,
    jsonpath_range_equals,
    jsonpath_string_equals,
    range_equals,
    string_equals,
)
from .tree import Subquery


def string_from_node(node: Item, escaped: bool = False) -> str:
    if isinstance(node, Word):
        return node.value if escaped else node.unescaped_value
    elif isinstance(node, Phrase):
        # Remove quotes from the beginning and the end of Phrase
        return node.value[1:-1] if escaped else node.unescaped_value[1:-1]
    else:
        raise UnsupportedGrammarException(...)


def range_from_node(node: Item) -> Tuple[Optional[str], Optional[str], bool, bool]:
    if not isinstance(node, Range):
        raise UnsupportedGrammarException(...)

    low_value = string_from_node(node.low)
    if low_value == "*":
        low_value = None
    elif has_wildcard(low_value):
        raise UnsupportedGrammarException(...)

    high_value = string_from_node(node.high)
    if high_value == "*":
        high_value = None
    elif has_wildcard(high_value):
        raise UnsupportedGrammarException(...)

    return low_value, high_value, node.include_low, node.include_high


class BaseField:
    accepts_subpath = False

    def __init__(self, column):
        self.column = column

    @property
    def column_type(self) -> Type[Object]:
        return self.column.class_

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        raise NotImplementedError

    def get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        if not self.accepts_subpath and len(path_selector) > 1:
            raise UnsupportedGrammarException(...)
        return self._get_condition(value, path_selector)


class StringField(BaseField):
    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value, escaped=True)
        return string_equals(self.column, string_value)


class SizeField(BaseField):
    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        units = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3}

        def parse_size(size) -> int:
            if re.match(r"^\d+$", size) is not None:
                return int(size)
            else:
                size = re.match(r"(\d+(?:[.]\d+)?)[ ]?([KMGT]?B)", size.upper())
                if size is None:
                    raise UnsupportedGrammarException("Invalid size value")
                number, unit = size.groups()
                return int(float(number) * units[unit])

        if isinstance(value, Range):
            low, high, include_low, include_high = range_from_node(value)
            if low is not None:
                low = parse_size(low)
            if high is not None:
                high = parse_size(high)
            return range_equals(self.column, low, high, include_low, include_high)
        else:
            string_value = string_from_node(value)
            target_value = parse_size(string_value)
            return self.column == target_value


class StringListField(BaseField):
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value, escaped=True)
        return self.column.any(string_equals(self.value_column, string_value))


class UUIDField(BaseField):
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value)
        if string_value == "*":
            return self.column.any(self.value_column.is_not(None))

        try:
            uuid_value = uuid.UUID(string_value)
        except ValueError:
            raise UnsupportedGrammarException("Field accepts only correct UUID values")

        return self.column.any(self.value_column == uuid_value)


class FavoritesField(BaseField):
    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value)
        if (
            not g.auth_user.has_rights(Capabilities.manage_users)
            and g.auth_user.login != string_value
        ):
            raise ObjectNotFoundException(
                "Only the mwdb admin can search for other users favorites"
            )

        if g.auth_user.login == string_value:
            user = g.auth_user
        else:
            user = db.session.query(User).filter(User.login == string_value).first()

        if user is None:
            raise ObjectNotFoundException(f"No such user: {value}")

        return self.column.any(User.id == user.id)


class AttributeField(BaseField):
    accepts_subpath = True

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        if len(path_selector) <= 1:
            raise UnsupportedGrammarException(
                "Missing attribute key (attribute.<key>:)"
            )

        attribute_key, _ = path_selector[1]
        attribute_definition = AttributeDefinition.query_for_read(
            key=attribute_key, include_hidden=True
        ).first()

        if attribute_definition is None:
            raise ObjectNotFoundException(f"No such attribute: {attribute_key}")

        if not isinstance(value, (Range, Term)):
            raise UnsupportedGrammarException(...)

        if (
            attribute_definition.hidden
            and (isinstance(value, Range) or value.has_wildcard())
            and not g.auth_user.has_rights(Capabilities.reading_all_attributes)
        ):
            raise FieldNotQueryableException(
                "Wildcards and ranges are not allowed for hidden attributes"
            )

        if isinstance(value, Range):
            low, high, include_low, include_high = range_from_node(value)
            jsonpath_condition = jsonpath_range_equals(
                path_selector[1:], low, high, include_low, include_high
            )
        else:
            string_value = string_from_node(value, escaped=True)
            jsonpath_condition = jsonpath_string_equals(path_selector[1:], string_value)
        return self.column.any(
            and_(
                Attribute.key == attribute_key,
                Attribute.value.op("@?")(jsonpath_condition),
            )
        )


class ConfigField(BaseField):
    accepts_subpath = True

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        if isinstance(value, Range):
            low, high, include_low, include_high = range_from_node(value)
            jsonpath_condition = jsonpath_range_equals(
                path_selector, low, high, include_low, include_high
            )
        else:
            string_value = string_from_node(value, escaped=True)
            # Cfg values in database are escaped, so we need to escape search phrase too
            string_value = string_value.encode("unicode_escape").decode("utf-8")
            jsonpath_condition = jsonpath_string_equals(path_selector, string_value)
        return self.column.op("@?")(jsonpath_condition)


class ShareField(BaseField):
    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value)

        group = db.session.query(Group).filter(Group.name == string_value).first()
        if group is None:
            raise ObjectNotFoundException(f"No such group: {string_value}")

        group_id = group.id
        if not g.auth_user.has_rights(Capabilities.manage_users) and group_id not in [
            group.id for group in g.auth_user.groups
        ]:
            raise ObjectNotFoundException(f"No such group: {string_value}")

        return self.column.any(ObjectPermission.group_id == group_id)


class SharerField(BaseField):
    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value)

        if (
            g.auth_user.has_rights(Capabilities.manage_users)
            or g.auth_user.has_rights(Capabilities.sharing_with_all)
            or g.auth_user.has_rights(Capabilities.access_uploader_info)
        ):
            uploaders = (
                db.session.query(User)
                .join(User.memberships)
                .join(Member.group)
                .filter(Group.name == string_value)
            ).all()
        else:
            uploaders = (
                db.session.query(User)
                .join(User.memberships)
                .join(Member.group)
                .filter(
                    and_(g.auth_user.is_member(Group.id), Group.workspace.is_(True))
                )
                .filter(or_(Group.name == string_value, User.login == string_value))
            ).all()
        if not uploaders:
            raise ObjectNotFoundException(f"No such user or group: {string_value}")

        uploader_ids = [u.id for u in uploaders]
        return self.column.any(
            and_(
                ObjectPermission.get_shares_filter(include_inherited_uploads=False),
                ObjectPermission.related_user_id.in_(uploader_ids),
            )
        )


class UploaderField(BaseField):
    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value)

        if string_value == "public":
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
                .filter(Group.name == string_value)
            ).all()
        else:
            uploaders = (
                db.session.query(User)
                .join(User.memberships)
                .join(Member.group)
                .filter(
                    and_(g.auth_user.is_member(Group.id), Group.workspace.is_(True))
                )
                .filter(or_(Group.name == string_value, User.login == string_value))
            ).all()
        if not uploaders:
            raise ObjectNotFoundException(f"No such user or group: {string_value}")

        uploader_ids = [u.id for u in uploaders]
        return self.column.any(
            and_(
                ObjectPermission.get_uploaders_filter(),
                ObjectPermission.related_user_id.in_(uploader_ids),
            )
        )


class DatetimeField(BaseField):
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

    def _get_date_range(self, date_string):
        formats = [
            ("%Y-%m-%d %H:%M", timedelta(minutes=1)),
            ("%Y-%m-%d %H:%M:%S", timedelta(seconds=1)),
            ("%Y-%m-%d", timedelta(days=1)),
        ]
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

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        if isinstance(value, Range):
            low, high, _, _ = range_from_node(value)
            # Exclusive ranges are handled as inclusive
            include_high = True
            include_low = True
            if low is not None:
                if self._is_relative_time(low):
                    low_datetime = self._get_border_time(low)
                else:
                    low_datetime = self._get_date_range(low)[0]
            else:
                low_datetime = None
            if high is not None:
                if self._is_relative_time(low):
                    high_datetime = self._get_border_time(high)
                else:
                    high_datetime = self._get_date_range(high)[1]
            else:
                high_datetime = None
        else:
            string_value = string_from_node(value)
            low_datetime, high_datetime = self._get_date_range(string_value)
            include_low = include_high = True
        return range_equals(self.column, low_datetime, high_datetime, include_low,
                            include_high)


class RelationField(BaseField):
    accepts_subquery = True

    def _get_condition(
        self, expression: Expression, subfields: List[Tuple[str, int]]
    ) -> Any:
        ...


class CommentAuthorField(BaseField):
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value)

        user = db.session.query(User).filter(User.login == string_value).first()
        if user is None:
            raise ObjectNotFoundException(f"No such user: {string_value}")

        return self.column.any(self.value_column == string_value)


class UploadCountField(BaseField):
    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
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

        if isinstance(value, Range):
            low, high, include_low, include_high = range_from_node(value)
            if low is not None:
                low = parse_upload_value(low)
            if high is not None:
                high = parse_upload_value(high)
            return range_equals(self.column, low, high, include_low, include_high)
        else:
            string_value = string_from_node(value)
            upload_value = parse_upload_value(string_value)
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
            column = MultiField.get_column(self.column_type, value)

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
