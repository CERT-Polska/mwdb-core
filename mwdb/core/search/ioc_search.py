"""
IOC-specific Lucene query builder.

Supports queries like:
    type:ip AND value:192.168.*
    severity:high
    category:c2 AND type:domain
    creation_time:>=2024-01-01
    tags:malware
"""

from typing import Any

from luqum.exceptions import ParseError
from luqum.parser import parser
from luqum.tree import (
    AndOperation,
    BaseGroup,
    Item,
    Not,
    OrOperation,
    Prohibit,
    SearchField,
)
from sqlalchemy import and_, not_, or_
from sqlalchemy.dialects.postgresql import array as pg_array

from mwdb.model import IOC, db

from .exceptions import FieldNotQueryableException, QueryParseException
from .node_to_value import node_is_range, range_from_node, string_from_node
from .parse_helpers import range_equals, string_equals
from .search import QueryTreeVisitor

# --- IOC field classes ---


class IOCStringField:
    """Matches an IOC column by exact/wildcard string."""

    def __init__(self, column):
        self.column = column

    def get_condition(self, node: Item) -> Any:
        value = string_from_node(node, escaped=True)
        return string_equals(self.column, value)


class IOCDatetimeField:
    """Matches IOC creation_time with range support."""

    def __init__(self, column):
        self.column = column

    def get_condition(self, node: Item) -> Any:
        from .fields import DatetimeField as _DT

        # Reuse the datetime parsing logic from the existing field
        dt_field = _DT(self.column)
        # DatetimeField._get_condition expects (node, path_selector)
        return dt_field._get_condition(node, [("creation_time", 0)])


class IOCTagsField:
    """Matches against the IOC tags array column."""

    def __init__(self, column):
        self.column = column

    def get_condition(self, node: Item) -> Any:
        value = string_from_node(node, escaped=True)
        # Use ANY to check if the value exists in the array
        from .parse_helpers import is_pattern_value, transform_for_like_statement

        if is_pattern_value(value):
            pattern = transform_for_like_statement(value)
            # Use unnest + LIKE for pattern matching against array elements
            from sqlalchemy import func, literal_column

            return IOC.id.in_(
                db.session.query(IOC.id)
                .filter(
                    func.array_to_string(IOC.tags, ",").like(
                        "%" + pattern.strip("%") + "%"
                    )
                )
                .subquery()
            )
        else:
            from .parse_helpers import transform_for_regular_statement

            plain_value = transform_for_regular_statement(value)
            return self.column.any(plain_value)


# --- Field mapping ---

ioc_field_mapping = {
    "type": IOCStringField(IOC.type),
    "value": IOCStringField(IOC.value),
    "category": IOCStringField(IOC.category),
    "severity": IOCStringField(IOC.severity),
    "creation_time": IOCDatetimeField(IOC.creation_time),
    "tag": IOCTagsField(IOC.tags),
}


# --- Visitor ---


class IOCQueryConditionVisitor(QueryTreeVisitor):
    """Builds SQLAlchemy conditions for IOC-specific queries."""

    def visit_search_field(self, node: SearchField, _) -> Any:
        field_name = node.name.lower()
        if field_name not in ioc_field_mapping:
            raise FieldNotQueryableException(
                f"Unknown IOC field: '{field_name}'. "
                f"Available fields: {', '.join(sorted(ioc_field_mapping.keys()))}"
            )
        field = ioc_field_mapping[field_name]
        return field.get_condition(node.expr)

    def visit_and_operation(self, node: AndOperation, context) -> Any:
        return and_(*[self.visit(child, context) for child in node.children])

    def visit_or_operation(self, node: OrOperation, context) -> Any:
        return or_(*[self.visit(child, context) for child in node.children])

    def visit_not(self, node: Not, context) -> Any:
        return not_(self.visit(node.a, context))

    def visit_prohibit(self, node: Prohibit, context) -> Any:
        return not_(self.visit(node.a, context))

    def visit_group(self, node: BaseGroup, context) -> Any:
        return self.visit(node.expr, context)


def build_ioc_query(query_string: str):
    """
    Parse a Lucene query string and return a filtered SQLAlchemy query
    against the IOC model.
    """
    try:
        tree = parser.parse(query_string)
    except ParseError as e:
        raise QueryParseException(str(e)) from e

    visitor = IOCQueryConditionVisitor()
    condition = visitor.visit(tree)
    return db.session.query(IOC).filter(condition)
