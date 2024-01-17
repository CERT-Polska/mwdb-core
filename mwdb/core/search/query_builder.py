from luqum.visitor import TreeVisitor
from luqum.tree import (
    SearchField,
    AndOperation,
    OrOperation,
    Not,
    Prohibit,
    BaseGroup,
    Item
)
from sqlalchemy import and_, or_, not_
from typing import Any, Dict

from .exceptions import UnsupportedGrammarException

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

    def visit_unsupported(
        self, node: Item, context: SQLQueryBuilderContext
    ):
        raise UnsupportedGrammarException(
            f"Lucene grammar element {node.__class__.__name__} "
            f"is not supported here"
        )


class QueryConditionVisitor(QueryTreeVisitor):
    """
    Builds sqlalchemy condition from parsed Lucene query
    """
    def visit_search_field(
        self, node: SearchField, context: SQLQueryBuilderContext
    ) -> Condition:
        ...

    # Visitor methods for operators

    def visit_and_operation(
        self, node: AndOperation, context: SQLQueryBuilderContext
    ) -> Condition:
        return and_(
            *[
                self.visit(child_node, context)
                for child_node in node.children
            ]
        )

    def visit_or_operation(
        self, node: OrOperation, context: SQLQueryBuilderContext
    ) -> Condition:
        return or_(
            *[
                self.visit(child_node, context)
                for child_node in node.children
            ]
        )

    def visit_not(
        self, node: Not, context: SQLQueryBuilderContext
    ) -> Condition:
        return not_(self.visit(node.a,  context))

    def visit_prohibit(
        self, node: Prohibit, context: SQLQueryBuilderContext
    ) -> Condition:
        return not_(self.visit(node.a, context))

    # Visitor methods for other elements

    def visit_group(
        self, node: BaseGroup, context: SQLQueryBuilderContext
    ) -> Condition:
        return self.visit(node.expr, context)
