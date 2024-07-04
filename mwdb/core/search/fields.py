import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Type

from dateutil.relativedelta import relativedelta
from flask import g
from luqum.tree import FieldGroup, Item, OpenRange, Range, Term
from sqlalchemy import String, Text, and_, any_, cast, column, exists, func, or_, select
from sqlalchemy.dialects.postgresql import ARRAY, array
from sqlalchemy.dialects.postgresql.array import CONTAINS
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
    InvalidValueException,
    ObjectNotFoundException,
    UnsupportedNodeTypeException,
)
from .node_to_value import node_is_range, range_from_node, string_from_node
from .parse_helpers import (
    PathSelector,
    ensure_inner_match_pattern,
    is_inner_match_pattern,
    is_pattern_value,
    jsonpath_config_string_equals,
    jsonpath_range_equals,
    jsonpath_string_equals,
    make_jsonpath_selector,
    range_equals,
    string_equals,
    transform_for_config_like_statement,
    transform_for_like_statement,
    transform_for_quoted_config_like_statement,
    transform_for_quoted_like_statement,
    unescape_string,
)


class BaseField:
    accepts_subpath = False

    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        raise NotImplementedError

    def get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        if not self.accepts_subpath and len(path_selector) > 1:
            raise FieldNotQueryableException("Subfields are not allowed for this field")
        return self._get_condition(node, path_selector)


class ColumnField(BaseField):
    def __init__(self, column):
        self.column = column

    @property
    def column_type(self) -> Type[Object]:
        return self.column.class_


class StringField(ColumnField):
    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node, escaped=True)
        return string_equals(self.column, string_value)


class SizeField(ColumnField):
    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        units = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3}

        def parse_size(size: str) -> int:
            if re.fullmatch(r"\d+", size) is not None:
                return int(size)
            else:
                size_match = re.fullmatch(
                    r"(\d+(?:[.]\d+)?)[ ]?([KMGT]?B)", size.upper()
                )
                if size_match is None:
                    raise InvalidValueException(size, expected="size")
                number, unit = size_match.groups()
                return int(float(number) * units[unit])

        if node_is_range(node):
            range_value = range_from_node(node)
            if range_value.low is not None:
                low = parse_size(range_value.low)
            else:
                low = None
            if range_value.high is not None:
                high = parse_size(range_value.high)
            else:
                high = None
            return range_equals(
                self.column,
                low,
                high,
                range_value.include_low,
                range_value.include_high,
            )
        else:
            string_value = string_from_node(node)
            target_value = parse_size(string_value)
            return self.column == target_value


class StringListField(ColumnField):
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node, escaped=True)
        return self.column.any(string_equals(self.value_column, string_value))


class UUIDField(ColumnField):
    def __init__(self, column, value_column):
        super().__init__(column)
        self.value_column = value_column

    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node)
        if string_value == "*":
            return self.column.any(self.value_column.is_not(None))

        try:
            uuid_value = uuid.UUID(string_value)
        except ValueError:
            raise InvalidValueException(string_value, expected="UUID")

        return self.column.any(self.value_column == uuid_value)


class FavoritesField(BaseField):
    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node)
        if (
            not g.auth_user.has_rights(Capabilities.manage_users)
            and g.auth_user.login != string_value
        ):
            raise ObjectNotFoundException(
                'You need "manage_users" capability to search for favorites of '
                "other users"
            )

        if g.auth_user.login == string_value:
            user = g.auth_user
        else:
            user = db.session.query(User).filter(User.login == string_value).first()

        if user is None:
            raise ObjectNotFoundException(f"No such user: {node}")

        return Object.followers.any(User.id == user.id)


class JSONBaseField(ColumnField):
    """
    Helper base class to generalize querying JSON columns
    """

    accepts_subpath = True

    def _get_value_for_like_statement(self, value: str) -> str:
        """
        Transforms Lucene escaped value into pattern for LIKE condition
        """
        return transform_for_like_statement(value)

    def _get_quoted_value_for_like_statement(
        self, value: str, escape_quotes: bool = True
    ) -> str:
        """
        Transforms Lucene escaped value into quoted JSON pattern
        for LIKE condition (looking for strings encoded inside JSON objects)
        """
        return transform_for_quoted_like_statement(value, escape_quotes=escape_quotes)

    def _get_jsonpath_for_range_equals(
        self,
        path_selector: PathSelector,
        low: Optional[str],
        high: Optional[str],
        include_low: bool,
        include_high: bool,
    ) -> str:
        """
        Transforms Lucene escaped value into jsonpath within-range query
        """
        return jsonpath_range_equals(
            path_selector, low, high, include_low, include_high
        )

    def _get_jsonpath_for_string_equals(
        self, path_selector: PathSelector, value: str
    ) -> str:
        """
        Transforms Lucene escaped value into jsonpath value-equals query
        """
        return jsonpath_string_equals(path_selector, value)

    def _get_json_condition(self, node: Item, path_selector: PathSelector) -> Any:
        if node_is_range(node):
            range_value = range_from_node(node)
            jsonpath_condition = self._get_jsonpath_for_range_equals(
                path_selector,
                range_value.low,
                range_value.high,
                range_value.include_low,
                range_value.include_high,
            )
            return self.column.op("@?")(jsonpath_condition)
        else:
            string_value = string_from_node(node, escaped=True)
            if is_pattern_value(string_value):
                jsonpath_selector = make_jsonpath_selector(path_selector)
                json_elements = func.jsonb_path_query(
                    self.column, jsonpath_selector
                ).alias("json_element")

                if is_inner_match_pattern(string_value):
                    # If pattern starts and ends with *, we are searching
                    # inside quoted string values and nested objects
                    # We use this kind of pattern because value we're looking for
                    # may be nested inside some other object, so special characters
                    # need additional escaping
                    pattern_value = self._get_quoted_value_for_like_statement(
                        string_value
                    )
                    # Unfortunately, MWDB full-text pattern allows searching not only
                    # for values, but also parts of JSON. That's why cfg:"*.com\"*"
                    # is unambiguous and may match two variants of JSON:
                    # - {"url": "example.com\""}
                    # - {"url": "example.com"}
                    pattern_value_raw_quotes = (
                        self._get_quoted_value_for_like_statement(
                            string_value, escape_quotes=False
                        )
                    )
                    json_element = cast(column(json_elements.name), Text)
                    if pattern_value != pattern_value_raw_quotes:
                        pattern_value = any_([pattern_value, pattern_value_raw_quotes])
                    value_condition = exists(
                        select([1])
                        .select_from(json_elements)
                        .where(json_element.like(pattern_value))
                    )
                    inner_match_pattern_value = pattern_value
                else:
                    # Pattern for literal value
                    pattern_value = self._get_value_for_like_statement(string_value)
                    # If not, we need to cast the element to unquoted value
                    # using #>> '{}' operator and assume that we're looking
                    # for literal value under specific key
                    json_element = column(json_elements.name).operate(
                        JSONPATH_ASTEXT, "{}", result_type=Text
                    )
                    value_condition = exists(
                        select([1])
                        .select_from(json_elements)
                        .where(json_element.like(pattern_value))
                    )
                    inner_match_pattern_value = (
                        self._get_quoted_value_for_like_statement(
                            ensure_inner_match_pattern(string_value)
                        )
                    )
                # Queries above perform very slow full table scan
                # because we can't directly index JSONB for quick wildcard
                # searches. That's why we combine query with another
                # LIKE condition over object.cfg::text column that is
                # less expensive. We hope that it will be used by
                # query planner to pre-filter results before applying
                # function scan.
                whole_config_match_condition = cast(self.column, Text).like(
                    inner_match_pattern_value
                )
                return and_(
                    value_condition,
                    whole_config_match_condition,
                )
            else:
                jsonpath_condition = self._get_jsonpath_for_string_equals(
                    path_selector, string_value
                )
                return self.column.op("@?")(jsonpath_condition)


class AttributeField(JSONBaseField):
    def __init__(self):
        super().__init__(Attribute.value)

    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        if len(path_selector) <= 1:
            raise FieldNotQueryableException("Missing attribute key (attribute.<key>:)")

        attribute_key, _ = path_selector[1]
        attribute_definition = AttributeDefinition.query_for_read(
            key=attribute_key, include_hidden=True
        ).first()

        if attribute_definition is None:
            raise ObjectNotFoundException(f"No such attribute: {attribute_key}")

        if not isinstance(node, (OpenRange, Range, Term)):
            raise UnsupportedNodeTypeException(node)

        if (
            attribute_definition.hidden
            and (node_is_range(node) or node.has_wildcard())
            and not g.auth_user.has_rights(Capabilities.reading_all_attributes)
        ):
            raise FieldNotQueryableException(
                "Using wildcards and ranges for hidden attributes "
                "requires 'reading_all_attributes' capability"
            )

        value_condition = self._get_json_condition(node, path_selector[1:])
        return Object.attributes.any(
            and_(
                Attribute.key == attribute_key,
                value_condition,
            )
        )


class ConfigField(JSONBaseField):
    def __init__(self):
        super().__init__(Config.cfg)

    def _get_value_for_like_statement(self, value: str) -> str:
        return transform_for_config_like_statement(value)

    def _get_quoted_value_for_like_statement(
        self, value: str, escape_quotes: bool = True
    ) -> str:
        return transform_for_quoted_config_like_statement(
            value, escape_quotes=escape_quotes
        )

    def _get_jsonpath_for_range_equals(
        self,
        path_selector: PathSelector,
        low: Optional[str],
        high: Optional[str],
        include_low: bool,
        include_high: bool,
    ) -> str:
        return jsonpath_range_equals(
            path_selector, low, high, include_low, include_high
        )

    def _get_jsonpath_for_string_equals(
        self, path_selector: PathSelector, value: str
    ) -> str:
        return jsonpath_config_string_equals(path_selector, value)

    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        return self._get_json_condition(node, path_selector)


class ShareField(BaseField):
    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node)

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
    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node)

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
    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node)

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
    def _is_relative_time(self, expression_value: str):
        pattern = r"^(\d+[yYmWwDdHhMSs])+$"
        return re.search(pattern, expression_value)

    def _get_border_time(self, expression_value):
        units = {
            "y": "years",
            "Y": "years",
            "m": "months",
            "W": "weeks",
            "w": "weeks",
            "D": "days",
            "d": "days",
            "H": "hours",
            "h": "hours",
            "M": "minutes",
            "S": "seconds",
            "s": "seconds",
        }
        pattern = rf"(\d+)([{''.join(units.keys())}])"
        conditions = re.findall(pattern, expression_value)
        delta_dict = {}
        for value, unit in conditions:
            unit_name = units.get(unit)
            # If field is unknown or is repeated e.g. 5M5M
            if unit_name is None or unit_name in delta_dict:
                raise InvalidValueException(expression_value, "date-time")
            delta_dict[unit_name] = int(value)
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

    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        if node_is_range(node):
            range_value = range_from_node(node)
            # Exclusive ranges are handled as inclusive
            include_high = True
            include_low = True
            low = range_value.low
            high = range_value.high
            if low is not None:
                if self._is_relative_time(low):
                    low_datetime = self._get_border_time(low)
                else:
                    low_datetime = self._get_date_range(low)[0]
            else:
                low_datetime = None
            if high is not None:
                if self._is_relative_time(high):
                    high_datetime = self._get_border_time(high)
                else:
                    high_datetime = self._get_date_range(high)[1]
            else:
                high_datetime = None
        else:
            string_value = string_from_node(node)
            low_datetime, high_datetime = self._get_date_range(string_value)
            include_low = include_high = True
        return range_equals(
            self.column, low_datetime, high_datetime, include_low, include_high
        )


class RelationField(ColumnField):
    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        from .search import QueryConditionVisitor

        if not isinstance(node, FieldGroup):
            raise UnsupportedNodeTypeException(node)
        condition = QueryConditionVisitor(Object).visit(node.expr)
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

    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node)

        user = db.session.query(User).filter(User.login == string_value).first()
        if user is None:
            raise ObjectNotFoundException(f"No such user: {string_value}")

        return self.column.any(self.value_column == string_value)


class UploadCountField(BaseField):
    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        def parse_upload_value(value):
            try:
                int_value = int(value)
                if int_value <= 0:
                    raise ValueError
            except ValueError:
                raise InvalidValueException(value, "positive integer value")
            return int_value

        if node_is_range(node):
            range_value = range_from_node(node)
            if range_value.low is not None:
                low = parse_upload_value(range_value.low)
            else:
                low = None
            if range_value.high is not None:
                high = parse_upload_value(range_value.high)
            else:
                high = None
            return range_equals(
                Object.upload_count,
                low,
                high,
                range_value.include_low,
                range_value.include_high,
            )
        else:
            string_value = string_from_node(node)
            upload_value = parse_upload_value(string_value)
            return Object.upload_count == upload_value


class MultiBaseField(BaseField):
    def _get_condition_for_value(self, escaped_value: str):
        raise NotImplementedError

    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node, escaped=True).strip()
        values_list = re.split("\\s+", string_value)
        condition = None
        for value in values_list:
            condition = or_(condition, self._get_condition_for_value(value))
        return condition


class MultiFileField(MultiBaseField):
    def _get_condition_for_value(self, escaped_value: str):
        value = unescape_string(escaped_value)
        if re.fullmatch(r"[0-9a-fA-F]{8}", value):
            return File.crc32 == value
        elif re.fullmatch(r"[0-9a-fA-F]{32}", value):
            return File.md5 == value
        elif re.fullmatch(r"[0-9a-fA-F]{40}", value):
            return File.sha1 == value
        elif re.fullmatch(r"[0-9a-fA-F]{64}", value):
            return File.sha256 == value
        elif re.fullmatch(r"[0-9a-fA-F]{128}", value):
            return File.sha512 == value
        else:
            raise ObjectNotFoundException(f"{value} is not valid hash value")


class MultiConfigField(MultiBaseField):
    def _get_condition_for_value(self, escaped_value: str):
        value = unescape_string(escaped_value)
        if re.fullmatch(r"[0-9a-fA-F]{64}", value):
            return Config.dhash == value
        else:
            value = transform_for_quoted_config_like_statement(
                "*" + escaped_value + "*"
            )
            json_element = Config._cfg.operate(JSONPATH_ASTEXT, "{}", result_type=Text)
            return json_element.like(value)


class MultiBlobField(MultiBaseField):
    def _get_condition_for_value(self, escaped_value: str):
        value = unescape_string(escaped_value)
        if re.fullmatch(r"[0-9a-fA-F]{64}", value):
            return TextBlob.dhash == value
        else:
            # Blobs are unicode-escaped too
            value = transform_for_config_like_statement("*" + escaped_value + "*")
            return TextBlob._content.like(value)


class FileNameField(BaseField):
    accepts_wildcards = True

    def _get_condition(self, node: Item, path_selector: PathSelector) -> Any:
        string_value = string_from_node(node, escaped=True)
        name_condition = string_equals(File.file_name, string_value)
        if is_pattern_value(string_value):
            """
            Should translate to:

            EXISTS (
                SELECT 1
                FROM unnest(object.alt_names) AS alt_name
                WHERE alt_name LIKE <pattern>
            )
            """
            escaped_value = transform_for_like_statement(string_value)
            alt_name = func.unnest(File.alt_names).alias("alt_name")
            alt_names_condition = exists(
                select([1])
                .select_from(alt_name)
                .where(column(alt_name.name).like(escaped_value))
            )
        else:
            # Use @> operator to utilize GIN index on ARRAY
            unescaped_value = unescape_string(string_value)
            value_array = cast(array([unescaped_value]), ARRAY(String))
            alt_names_condition = File.alt_names.operate(CONTAINS, value_array)
        return or_(name_condition, alt_names_condition)
