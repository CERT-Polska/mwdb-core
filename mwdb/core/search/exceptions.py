class SQLQueryBuilderBaseException(Exception):
    """
    Base exception for SQLQueryBuilder
    """


class UnsupportedGrammarException(SQLQueryBuilderBaseException):
    """
    Raised when SQLQueryBuilder does not support given Lucene grammar
    """


class FieldNotQueryableException(SQLQueryBuilderBaseException):
    """
    Raised when field does not exists, so it can't be queried, eg. file.unexistent_field
    """


class MultipleObjectsQueryException(SQLQueryBuilderBaseException):
    """
    Raised when multiple object types are queried,
    e.g. file.file_name:something AND static.cfg:something2
    """


class ObjectNotFoundException(SQLQueryBuilderBaseException):
    """
    Raised when object referenced in query condition can't be found
    """
