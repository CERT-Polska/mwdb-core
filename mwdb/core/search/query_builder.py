from typing import Any, Dict, Optional, Type

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
from luqum.visitor import TreeVisitor
from sqlalchemy import and_, not_, or_

from mwdb.model import Object, db

from .exceptions import QueryParseException, UnsupportedNodeTypeException
from .mappings import get_field_mapper

# SQLAlchemy doesn't provide typings
Condition = Any
SQLQueryBuilderContext = Dict


class QueryTreeVisitor(TreeVisitor):
    """
    Original TreeVisitor returns generators and lists.
    It's unnecessary: we want to return one object for one node
    """

    generic_visitor_method_name = "visit_unsupported"

    def visit_iter(self, node, context):
        method = self._get_method(node)
        return method(node, context)

    def visit(self, tree, context=None):
        if context is None:
            context = {}
        return self.visit_iter(tree, context=context)

    def visit_unsupported(self, node: Item, context: SQLQueryBuilderContext):
        raise UnsupportedNodeTypeException(node)


class QueryConditionVisitor(QueryTreeVisitor):
    """
    Builds sqlalchemy condition from parsed Lucene query
    """

    def __init__(self, queried_type):
        super().__init__()
        self.queried_type = queried_type

    def visit_search_field(
        self, node: SearchField, _: SQLQueryBuilderContext
    ) -> Condition:
        field_mapper, path_selector = get_field_mapper(self.queried_type, node.name)
        condition = field_mapper.get_condition(node.expr, path_selector)
        return condition

    def visit_and_operation(
        self, node: AndOperation, context: SQLQueryBuilderContext
    ) -> Condition:
        return and_(*[self.visit(child_node, context) for child_node in node.children])

    def visit_or_operation(
        self, node: OrOperation, context: SQLQueryBuilderContext
    ) -> Condition:
        return or_(*[self.visit(child_node, context) for child_node in node.children])

    def visit_not(self, node: Not, context: SQLQueryBuilderContext) -> Condition:
        return not_(self.visit(node.a, context))

    def visit_prohibit(
        self, node: Prohibit, context: SQLQueryBuilderContext
    ) -> Condition:
        return not_(self.visit(node.a, context))

    def visit_group(
        self, node: BaseGroup, context: SQLQueryBuilderContext
    ) -> Condition:
        return self.visit(node.expr, context)


def build_query(query: str, queried_type: Optional[Type[Object]] = None):
    try:
        tree = parser.parse(query)
    except ParseError as e:
        raise QueryParseException(str(e)) from e
    queried_type = queried_type or Object
    condition_visitor = QueryConditionVisitor(queried_type)
    condition = condition_visitor.visit(tree)
    return db.session.query(queried_type).filter(condition)
