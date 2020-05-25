import re

from datetime import datetime, timedelta
from typing import List, Union, Type, Any

from flask import g

from luqum.tree import Range, Term
from sqlalchemy import and_

from model import db, Object, Metakey, MetakeyPermission, Group, ObjectPermission, User
from model.object import AccessType

from core.capabilities import Capabilities

from .exceptions import FieldNotQueryableException, UnsupportedGrammarException, ObjectNotFoundException


Expression = Union[Range, Term]


def get_term_value(node: Term) -> str:
    """
    Retrieves unescaped value from Term with transformed wildcards
    to the SQL form
    :param node: luqum.Term object
    :return: Unescaped value
    """
    if node.has_wildcard():
        wildcard_map = {
            "*": "%",
            "?": "_"
        }
        # Escape already contained SQL wildcards
        node_value = re.sub(r"([%_])", r"\\\1", node.value)
        # Transform unescaped Lucene wildcards to SQL form
        node_value = Term.WILDCARDS_PATTERN.sub(
            lambda m: wildcard_map[m.group(0)],
            node_value
        )
        # Unescape Lucene escaped special characters
        node_value = Term.WORD_ESCAPED_CHARS.sub(
            r'\1', node_value
        )
        return node_value
    else:
        return node.unescaped_value


class BaseField:
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
        if isinstance(expression, Range):
            raise UnsupportedGrammarException(
                f"Range queries are not allowed for string fields"
            )

        value = get_term_value(expression)
        if expression.has_wildcard():
            return self.column.like(value)
        else:
            return self.column == value


class IntegerField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )
        if isinstance(expression, Range):
            low_value = expression.low.value
            high_value = expression.high.value
            if not low_value.isdigit() or not high_value.isdigit():
                raise UnsupportedGrammarException(
                    "Field supports only integer values"
                )
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
            return and_(low_condition, high_condition)
        else:
            if not expression.value.isdigit():
                raise UnsupportedGrammarException(
                    "Field supports only integer values"
                )
            return self.column == expression.value


class ListField(BaseField):
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )
        if isinstance(expression, Range):
            raise UnsupportedGrammarException(
                f"Range queries are not allowed for list fields"
            )

        value = get_term_value(expression)

        if expression.has_wildcard():
            return self.column.any(self.value_column.like(value))
        else:
            return self.column.any(self.value_column == value)


class AttributeField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if isinstance(expression, Range):
            raise UnsupportedGrammarException(
                f"Range queries are not allowed for attribute fields"
            )
        if len(remainder) > 1:
            raise FieldNotQueryableException(
                f"Attribute doesn't have subfields: {'.'.join(remainder[1:])}"
            )

        attribute_key = remainder[0]

        # Checking permissions for a given key
        if not g.auth_user.has_rights(Capabilities.reading_all_attributes):
            metakey = (db.session.query(MetakeyPermission)
                                 .filter(MetakeyPermission.key == attribute_key)
                                 .filter(MetakeyPermission.can_read.is_(True))
                                 .filter(g.auth_user.is_member(MetakeyPermission.group_id))).first()
            if metakey is None:
                raise ObjectNotFoundException(f"No such attribute: {attribute_key}")
            if metakey.template.hidden and expression.has_wildcard():
                raise FieldNotQueryableException("Wildcards are not allowed for hidden attributes")

        value = get_term_value(expression)
        if expression.has_wildcard():
            value_condition = Metakey.value.like(value)
        else:
            value_condition = Metakey.value == value

        return self.column.any(
            and_(Metakey.key == attribute_key, value_condition)
        )


class ShareField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )
        if isinstance(expression, Range):
            raise UnsupportedGrammarException(
                f"Range queries are not allowed for shared field"
            )
        if expression.has_wildcard():
            raise UnsupportedGrammarException(
                f"Wildcards are not allowed for shared field"
            )

        value = expression.unescaped_value

        group = db.session.query(Group).filter(Group.name == value).first()
        if group is None:
            raise ObjectNotFoundException(f"No such group: {value}")

        group_id = group.id
        if not g.auth_user.has_rights(Capabilities.manage_users) and \
                group_id not in [group.id for group in g.auth_user.groups]:
            raise ObjectNotFoundException(f"No such group: {value}")

        return self.column.any(ObjectPermission.group_id == group_id)


class UploaderField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )
        if isinstance(expression, Range):
            raise UnsupportedGrammarException(
                f"Range queries are not allowed for uploader field"
            )
        if expression.has_wildcard():
            raise UnsupportedGrammarException(
                f"Wildcards are not allowed for uploader field"
            )

        value = expression.unescaped_value

        if not g.auth_user.has_rights(Capabilities.manage_users) and not g.auth_user.login == value:
            raise ObjectNotFoundException("Currently you can query only for your own uploads.")

        uploader = db.session.query(User).filter(User.login == value).first()
        if uploader is None:
            raise ObjectNotFoundException(f"No such user: {value}")

        uploader_id = uploader.id
        return self.column.any(
            and_(
                ObjectPermission.related_user_id == uploader_id,
                ObjectPermission.reason_type == AccessType.ADDED,
                ObjectPermission.related_object_id == ObjectPermission.object_id
            )
        )


class JSONField(BaseField):
    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        json_path = '.'.join(remainder)

        column_to_query = self.column[json_path].astext

        if isinstance(expression, Range):
            raise UnsupportedGrammarException(
                f"Range queries are not allowed for JSON fields"
            )

        value = get_term_value(expression)

        if expression.has_wildcard():
            return column_to_query.like(value)
        else:
            return column_to_query == value


class DatetimeField(BaseField):
    def _get_date_range(self, date_node):
        formats = [
            ("%Y-%m-%d %H:%M", timedelta(minutes=1)),
            ("%Y-%m-%d %H:%M:%S", timedelta(seconds=1)),
            ("%Y-%m-%d", timedelta(days=1))
        ]
        date_string = date_node.value

        for fmt, range_offs in formats:
            try:
                timestamp = datetime.strptime(date_string, fmt)
                return timestamp, timestamp + range_offs
            except ValueError:
                continue
        else:
            raise FieldNotQueryableException(f"Unsupported date-time format ({date_string})")

    def get_condition(self, expression: Expression, remainder: List[str]) -> Any:
        if remainder:
            raise FieldNotQueryableException(
                f"Field doesn't have subfields: {'.'.join(remainder)}"
            )

        if isinstance(expression, Range):
            if not (expression.include_low and expression.include_high):
                raise UnsupportedGrammarException("Exclusive range is not allowed for date-time field")
            low = self._get_date_range(expression.low)[0]
            high = self._get_date_range(expression.high)[1]
        else:
            if expression.has_wildcard():
                raise UnsupportedGrammarException("Wildcards are not allowed for date-time field")
            low, high = self._get_date_range(expression)

        return and_(self.column >= low, self.column < high)
