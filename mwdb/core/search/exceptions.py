from typing import Optional, Tuple, Type

from luqum.tree import Item


class QueryBaseException(Exception):
    """
    Base exception for search engine
    """


class QueryParseException(QueryBaseException):
    """
    Raised when Lucene parser is unable to parse a query
    """


class UnsupportedNodeException(QueryBaseException):
    def __init__(self, message: str, node: Item) -> None:
        super().__init__(f"{message} ({node.pos}:{node.pos + node.size - 1})")


class UnsupportedNodeTypeException(UnsupportedNodeException):
    """
    Raised when query visitor does not support given Lucene grammar
    """

    def __init__(self, node: Item, expected: Optional[Tuple[Type, ...]] = None) -> None:
        message = f"{node.__class__.__name__} is not supported here"
        if expected:
            message += f", expected {', '.join(typ.__name__ for typ in expected)}"
        super().__init__(message, node)


class UnsupportedPatternValue(UnsupportedNodeException):
    def __init__(self, node: Item) -> None:
        super().__init__("Pattern values are not supported here", node)


class InvalidValueException(QueryBaseException):
    def __init__(self, value: str, expected: str) -> None:
        super().__init__(f"Invalid value format: {value}, expected {expected}")


class FieldNotQueryableException(QueryBaseException):
    """
    Raised when field does not exist, so it can't be queried, eg. file.unexistent_field
    """


class ObjectNotFoundException(QueryBaseException):
    """
    Raised when object referenced in query condition can't be found
    """
