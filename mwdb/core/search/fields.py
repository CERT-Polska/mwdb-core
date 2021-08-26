import re
import uuid
from datetime import datetime, timedelta
from typing import Any, List, Type, Union

import regex
from flask import g
from luqum.tree import Range, Term
from sqlalchemy import Text, and_, column, exists, func, or_, select
from sqlalchemy.dialects.postgresql.json import JSONPATH_ASTEXT

from mwdb.core.capabilities import Capabilities
from mwdb.model import (
    Group,
    Member,
    Metakey,
    MetakeyDefinition,
    Object,
    ObjectPermission,
    User,
    db,
)
from mwdb.model.object import AccessType

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


class BaseField:
    accepts_range = False
    accepts_subquery = False

    def __init__(self, column):
        self.column = column

    @property
    def field_type(self) -> Type[Object]:
        return self.column.class_

    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        raise NotImplementedError()


class StringField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )

        value = get_term_value(expression)
        if expression.has_wildcard():
            return self.column.like(value)
        else:
            return self.column == value


class SizeField(BaseField):
    accepts_range = True

    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )

        units = {"B": 1, "KB": 1024, "MB": 1024 ** 2, "GB": 1024 ** 3}

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
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )

        value = get_term_value(expression)

        if expression.has_wildcard():
            return self.column.any(self.value_column.like(value))
        else:
            return self.column.any(self.value_column == value)


class UUIDField(BaseField):
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )

        value = get_term_value(expression)

        if expression.has_wildcard():
            raise UnsupportedGrammarException("Wildcards are not allowed here")

        try:
            uuid_value = uuid.UUID(value)
        except ValueError:
            raise UnsupportedGrammarException("Field accepts only correct UUID values")

        return self.column.any(self.value_column == uuid_value)


class FavoritesField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )
        if expression.has_wildcard():
            raise UnsupportedGrammarException(
                "Wildcards are not allowed for shared field"
            )

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
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if len(remainder) > 1:
            raise FieldNotQueryableException(
                f"Attribute doesn't have subfields: {'.'.join(remainder[1:])}"
            )

        if remainder:
            attribute_key = remainder[0]
        else:
            raise UnsupportedGrammarException("Missing attribute key (meta.<key>:)")

        metakey_definition = MetakeyDefinition.query_for_read(
            key=attribute_key, include_hidden=True
        ).first()

        if metakey_definition is None:
            raise ObjectNotFoundException(f"No such attribute: {attribute_key}")

        if (
            metakey_definition.hidden
            and expression.has_wildcard()
            and not g.auth_user.has_rights(Capabilities.reading_all_attributes)
        ):
            raise FieldNotQueryableException(
                "Wildcards are not allowed for hidden attributes"
            )

        value = get_term_value(expression)
        if expression.has_wildcard():
            value_condition = Metakey.value.like(value)
        else:
            value_condition = Metakey.value == value

        return self.column.any(and_(Metakey.key == attribute_key, value_condition))


class ShareField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )
        if expression.has_wildcard():
            raise UnsupportedGrammarException(
                "Wildcards are not allowed for shared field"
            )

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


class UploaderField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )
        if expression.has_wildcard():
            raise UnsupportedGrammarException(
                "Wildcards are not allowed for uploader field"
            )

        value = expression.unescaped_value
        if value == "public":
            raise ObjectNotFoundException(
                "uploader:public is no-op, all uploaders are in public group"
            )

        # Look only for upload actions
        # (reason_type=ADDED and uploaded_object=shared_object)
        condition = and_(
            ObjectPermission.reason_type == AccessType.ADDED,
            ObjectPermission.related_object_id == ObjectPermission.object_id,
        )

        if g.auth_user.has_rights(Capabilities.manage_users):
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
            # Regular users can see only uploads to its own groups
            condition = and_(
                condition, g.auth_user.is_member(ObjectPermission.group_id)
            )
        if not uploaders:
            raise ObjectNotFoundException(f"No such user or group: {value}")

        uploader_ids = [u.id for u in uploaders]
        return self.column.any(
            and_(condition, ObjectPermission.related_user_id.in_(uploader_ids))
        )


class JSONField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        value = get_term_value(expression)

        def jsonpath_escape(field):
            """Escapes field to be correctly represented in jsonpath"""
            # Escape all unescaped double quotes
            field = regex.sub(r'(?<!\\)(?:\\\\)*\K["]', '\\"', field)
            # Find trailing non-escaped asterisks
            asterisk_r = re.search(r"(?<!\\)(?:\\\\)*([*]+)$", field)
            if not asterisk_r:
                asterisks = ""
            else:
                asterisk_levels = len(asterisk_r.group(1))
                field = field[:-asterisk_levels]
                asterisks = asterisk_levels * "[*]"
            # Unescape all escaped asterisks
            field = regex.sub(r"(?<!\\)(?:\\\\)*\K(\\[*])", "*", field)
            return f'"{field}"{asterisks}'

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
        json_path = ".".join(["$"] + [jsonpath_escape(field) for field in remainder])
        # Make aliased function call
        json_elements = func.jsonb_path_query(self.column, json_path).alias(
            "json_element"
        )
        # Use #>>'{}' to extract value as text
        json_element = column("json_element").operate(
            JSONPATH_ASTEXT, "{}", result_type=Text
        )
        if expression.has_wildcard():
            condition = json_element.like(value)
        else:
            condition = json_element == value
        return exists(select([1]).select_from(json_elements).where(condition))


class DatetimeField(BaseField):
    accepts_range = True

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

    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )

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
                high = self._get_date_range(expression.high)[1]
                return self.column < high
            if expression.high.value == "*":
                low = self._get_date_range(expression.low)[0]
                return self.column >= low

            low = self._get_date_range(expression.low)[0]
            high = self._get_date_range(expression.high)[1]
        else:
            if expression.has_wildcard():
                raise UnsupportedGrammarException(
                    "Wildcards are not allowed for date-time field"
                )
            low, high = self._get_date_range(expression)

        return and_(self.column >= low, self.column < high)


class RelationField(BaseField):
    accepts_subquery = True

    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )
        if not isinstance(expression, Subquery):
            raise UnsupportedGrammarException(
                "Only subquery is allowed for relation field"
            )
        return self.column.any(Object.id.in_(expression.subquery))
