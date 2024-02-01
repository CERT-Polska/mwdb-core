import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Tuple, Type

from dateutil.relativedelta import relativedelta
from flask import g
from luqum.tree import FieldGroup, Item, Phrase, Range, Term, Word
from sqlalchemy import and_, any_, column, func, or_

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
    InvalidValueException,
    ObjectNotFoundException,
    UnsupportedLikeStatement,
    UnsupportedNodeTypeException,
)
from .parse_helpers import (
    PathSelector,
    escape_for_like_statement,
    has_wildcard,
    jsonpath_range_equals,
    jsonpath_string_equals,
    range_equals,
    string_equals,
    unescape_string,
)


def string_from_node(node: Item, escaped: bool = False) -> str:
    if isinstance(node, Word):
        return node.value if escaped else node.unescaped_value
    elif isinstance(node, Phrase):
        # Remove quotes from the beginning and the end of Phrase
        return node.value[1:-1] if escaped else node.unescaped_value[1:-1]
    else:
        raise UnsupportedNodeTypeException(node)


def range_from_node(node: Item) -> Tuple[Optional[str], Optional[str], bool, bool]:
    if not isinstance(node, Range):
        raise UnsupportedNodeTypeException(node)

    low_value = string_from_node(node.low)
    if low_value == "*":
        low_value = None
    elif has_wildcard(low_value):
        raise UnsupportedLikeStatement(node.low)

    high_value = string_from_node(node.high)
    if high_value == "*":
        high_value = None
    elif has_wildcard(high_value):
        raise UnsupportedLikeStatement(node.high)

    return low_value, high_value, node.include_low, node.include_high


class BaseField:
    accepts_subpath = False

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        raise NotImplementedError

    def get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        if not self.accepts_subpath and len(path_selector) > 1:
            raise FieldNotQueryableException("Subfields are not allowed for this field")
        return self._get_condition(value, path_selector)


class ColumnField(BaseField):
    def __init__(self, column):
        self.column = column

    @property
    def column_type(self) -> Type[Object]:
        return self.column.class_


class StringField(ColumnField):
    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value, escaped=True)
        return string_equals(self.column, string_value)


class SizeField(ColumnField):
    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        units = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3}

        def parse_size(size) -> int:
            if re.match(r"^\d+$", size) is not None:
                return int(size)
            else:
                size_match = re.match(r"(\d+(?:[.]\d+)?)[ ]?([KMGT]?B)", size.upper())
                if size_match is None:
                    raise InvalidValueException(size, expected="size")
                number, unit = size_match.groups()
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


class StringListField(ColumnField):
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value, escaped=True)
        return self.column.any(string_equals(self.value_column, string_value))


class UUIDField(ColumnField):
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
            raise InvalidValueException(string_value, expected="UUID")

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

        return Object.followers.any(User.id == user.id)


class AttributeField(BaseField):
    accepts_subpath = True

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        if len(path_selector) <= 1:
            raise FieldNotQueryableException("Missing attribute key (attribute.<key>:)")

        attribute_key, _ = path_selector[1]
        attribute_definition = AttributeDefinition.query_for_read(
            key=attribute_key, include_hidden=True
        ).first()

        if attribute_definition is None:
            raise ObjectNotFoundException(f"No such attribute: {attribute_key}")

        if not isinstance(value, (Range, Term)):
            raise UnsupportedNodeTypeException(value)

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
        return Object.attributes.any(
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
        return Config.cfg.op("@?")(jsonpath_condition)


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

        return Object.shares.any(ObjectPermission.group_id == group_id)


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
        return Object.shares.any(
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
        return Object.shares.any(
            and_(
                ObjectPermission.get_uploaders_filter(),
                ObjectPermission.related_user_id.in_(uploader_ids),
            )
        )


class DatetimeField(ColumnField):
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
            return None
        return unit

    def _get_border_time(self, expression_value):
        pattern = r"(\d+)([yYmWwDdHhMSs])"
        conditions = re.findall(pattern, expression_value)
        delta_dict = {}
        for value, unit in conditions:
            field = self._get_field_for_unit(unit)
            if field is None:
                raise InvalidValueException(expression_value, "date-time")
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
            raise InvalidValueException(date_string, "date-time")

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
        return range_equals(
            self.column, low_datetime, high_datetime, include_low, include_high
        )


class RelationField(ColumnField):
    def _get_condition(self, subquery: Item, path_selector: PathSelector) -> Any:
        from .query_builder import QueryConditionVisitor

        if not isinstance(subquery, FieldGroup):
            raise UnsupportedNodeTypeException(subquery)
        condition = QueryConditionVisitor(Object).visit(subquery.expr)
        return self.column.any(
            Object.id.in_(
                db.session.query(Object.id)
                .filter(condition)
                .filter(g.auth_user.has_access_to_object(Object.id))
            )
        )


class CommentAuthorField(ColumnField):
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
                int_value = int(value)
                if int_value <= 0:
                    raise ValueError
            except ValueError:
                raise InvalidValueException(value, "positive integer value")
            return int_value

        if isinstance(value, Range):
            low, high, include_low, include_high = range_from_node(value)
            if low is not None:
                low = parse_upload_value(low)
            if high is not None:
                high = parse_upload_value(high)
            return range_equals(
                Object.upload_count, low, high, include_low, include_high
            )
        else:
            string_value = string_from_node(value)
            upload_value = parse_upload_value(string_value)
            return Object.upload_count == upload_value


class MultiField(ColumnField):
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

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        """
        TODO I don't know how to reimplement it right now
        """
        raise NotImplementedError


class FileNameField(BaseField):
    accepts_wildcards = True

    def _get_condition(self, value: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(value, escaped=True)
        name_condition = string_equals(File.file_name, string_value)
        if has_wildcard(string_value):
            """
            Should translate to:

            EXISTS (
                SELECT 1
                FROM unnest(object.alt_names) AS alt_name
                WHERE alt_name LIKE <pattern>
            )
            """
            escaped_value = escape_for_like_statement(string_value)
            alt_name = func.unnest(File.alt_names).alias("alt_name")
            alt_names_condition = (
                db.session.query(alt_name)
                .select_from(alt_name)
                .filter(column(alt_name.name).like(escaped_value))
                .exists()
            )
        else:
            unescaped_value = unescape_string(string_value)
            alt_names_condition = any_(File.alt_names) == unescaped_value
        return or_(name_condition, alt_names_condition)
