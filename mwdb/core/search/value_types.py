from luqum.tree import Word, Phrase, Item, Term, Range as LuqumRange
from .exceptions import UnsupportedGrammarException
from typing import TypeVar, Pattern, List, Tuple, Type, Generic, Optional
import uuid
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta

from sqlalchemy import and_, true
from sqlalchemy.sql.expression import ColumnElement, ColumnOperators

import re

T = TypeVar("T", bound=Item)

def match_unescaped(control_chars: str) -> Pattern:
    # Ensure that \ is not a control character because it makes things
    # more complicated. Lucene doesn't allow for unescaped \ anyway
    assert "\\" not in control_chars
    # Escape regex control characters in set of control characters
    # to be safely put in square brackets [...]
    re_control_chars = re.sub(r"([\^\-\]])", r"\\\1", control_chars)
    # Make pattern that finds all unescaped control characters
    return re.compile(
        rf"((?<=[^\\])[{re_control_chars}]|"  # Chars preceded not by \
        rf"\\\\[{re_control_chars}]|"  # Chars preceded by escaped slash
        rf"^[{re_control_chars}])"  # Chars at the beginning of string
    )

def escape_for_like_statement(value: str) -> str:
    """
    Escaping for LIKE (SQL) statement:

    Algorithm is as follows:
    - Assume that escape character is universal in Lucene
      and target pattern syntax has also '\' as escape character
    - Escape all control characters unless they're already escaped
      (double "escaping" will escape the slash)
    - Unescaped Lucene wildcards should be converted to target pattern
      wildcards
    - Let's assume that we support escape characters of target pattern
      so we don't unescape things already escaped by user (e.g. \n will be
      escape character for newline if target pattern treats \n as newline)
    """
    wildcard_map = {"*": "%", "?": "_"}
    control_chars = "%_"
    value = match_unescaped(control_chars).sub(r"\\\1", value)
    value = match_unescaped("*?").sub(
        # \\\\? may be part of match group
        lambda m: m.group(0)[:-1] + wildcard_map[m.group(0)[-1]], value
    )
    return value

def unescape_string(value: str) -> str:
    return re.sub(r"\\(.)", r"\1", value)

def escape_for_jsonpath_regex_statement(value: str) -> str:
    """
    Escaping for like_regex (jsonpath) statement.
    Algorithm similar to escape_for_like_statement

    (from pgsql documentation) ===
    Keep in mind that the pattern argument of like_regex is a JSON path
    string literal, written according to the rules given in Section 8.14.7.
    This means in particular that any backslashes you want to use in the
    regular expression must be doubled.
    For example, to match string values of the root document that contain
    only digits: $.* ? (@ like_regex "^\\d+$")
    """
    wildcard_map = {"*": ".*", "?": "."}
    # Regex POSIX special characters + terminator of the pattern
    # We have not included ? and *, because these unescaped characters
    # will be converted to proper wildcards
    control_chars = ".[]{}()^$+|\""
    value = match_unescaped(control_chars).sub(r"\\\1", value)
    # Convert all unescaped wildcards
    value = match_unescaped("*?").sub(
        lambda m: m.group(0)[:-1] + wildcard_map[m.group(0)[-1]], value
    )
    # Double all backslashes
    return re.sub(r"\\", r"\\\\", value)


def jsonpath_quote(value: str) -> str:
    """
    Quotes field to be correctly represented in jsonpath
    """
    # Escape all double quotes and backslashes
    value = re.sub(r'(["\\])', r"\\\1", value)
    return f'"{value}"'


def make_jsonpath_selector(path_selector: List[Tuple[str, int]]) -> str:
    """
    Makes jsonpath from field path

    key.array*.child => $."key"."array"[*]."child"
    """
    _, root_asterisks = path_selector[0]
    root = "$" + ("[*]" * root_asterisks)
    return ".".join(
        [root]
        + [
            jsonpath_quote(field) + ("[*]" * asterisks)
            for field, asterisks in path_selector[1:]
        ]
    )

def is_nonstring_object(value: str) -> bool:
    """
    Checks if string value may be also a number or boolean,
    so JSON must be queried using both types
    """
    return bool(re.match(r"^(false|true|null|\d+([.]\d+)?)$", value))

class Node:
    def __init__(self, node: T):
        self.node = node


class Value(Node):
    def __init__(self, node: T):
        super().__init__(node)
        self.value = self._parse_value()

    def _parse_value(self):
        if type(self.node) is Word:
            return self.node.value
        elif type(self.node) is Phrase:
            return self.node.value[1:-1]
        else:
            raise UnsupportedGrammarException("Wrong value type")  # todo

    def is_any(self):
        return self.value == "*"

    def has_wildcard(self):
        return Term.WILDCARDS_PATTERN.search(self.value) is not None


class StringValue(Value):
    def equals(self, column: ColumnElement) -> ColumnOperators:
        """
        Returns == or LIKE operation for column
        """
        if self.has_wildcard():
            escaped_value = escape_for_like_statement(self.value)
            return column.like(escaped_value, escape="\\")
        else:
            unescaped_value = unescape_string(self.value)
            return column == unescaped_value

    def jsonpath_equals(self, path_selector: List[Tuple[str, int]]) -> str:
        """
        Returns jsonpath query that matches path and value
        """
        if self.has_wildcard():
            escaped_value = escape_for_jsonpath_regex_statement(self.value)
            condition = f'@ like_regex "{escaped_value}"'
        elif is_nonstring_object(self.value):
            condition = f"@ == {jsonpath_quote(self.value)} || @ == {self.value}"
        else:
            condition = f"@ == {jsonpath_quote(self.value)}"

        jsonpath_selector = make_jsonpath_selector(path_selector)
        return f"{jsonpath_selector} ? ({condition})"

class IntegerValue(Value):
    def _parse_value(self):
        value = super()._parse_value()
        if re.match("^\d+$", value):
            return int(value)
        else:
            raise UnsupportedGrammarException("Incorrect integer value format") # todo

class SizeValue(Value):
    def _parse_value(self):
        units = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3}

        value = super()._parse_value()
        if re.match("^\d+$", value):
            return int(value)
        else:
            size = re.match(r"(\d+(?:[.]\d+)?)[ ]?([KMGT]?B)", value.upper())
            if size is None:
                raise UnsupportedGrammarException("Invalid size value")
            number, unit = size.groups()
            return int(float(number) * units[unit])

class ReferenceValue(Value):
    """
    User login, group, UUID...
    """
    def _parse_value(self):
        value = super()._parse_value()
        if value != "*" and Term.WILDCARDS_PATTERN.search(value) is not None:
            raise UnsupportedGrammarException("Only single wildcard allowed")
        return unescape_string(value)

class UUIDValue(ReferenceValue):
    def _parse_value(self):
        value = super()._parse_value()
        try:
            return uuid.UUID(value)
        except ValueError:
            raise UnsupportedGrammarException("Field accepts only correct UUID values")

U = TypeVar("U")

class Range(Generic[U]):
    def __init__(self, low_value: Optional[U], high_value: Optional[U],
                       include_low: bool, include_high: bool) -> None:
        self.low = low_value
        self.high = high_value
        self.include_low = include_low
        self.include_high = include_high

        # Swap boundaries if both defined and low > high
        if (
                self.low is not None
                and self.high is not None
                and self.low > self.high
        ):
            self.low, self.high = self.high, self.low
            self.include_low, self.include_high = self.include_high, self.include_low

    def equals(self, column: ColumnElement) -> ColumnOperators:
        low_condition = (
            column >= self.low
            if self.include_low
            else column > self.low
        )
        high_condition = (
            column <= self.high
            if self.include_high
            else column < self.high
        )

        if self.high is None and self.low is None:
            return true()
        if self.high is None:
            return low_condition
        if self.low is None:
            return high_condition
        return and_(low_condition, high_condition)

    def jsonpath_equals(self, path_selector: List[Tuple[str, int]]) -> str:
        low_condition = (
            f"@ >= {self.low}"
            if self.include_low
            else f"@ > {self.low}"
        )
        high_condition = (
            f"@ <= {self.high}"
            if self.include_high
            else f"@ < {self.high}"
        )

        if self.high is None and self.low is None:
            condition = "@"
        elif self.high is None:
            condition = low_condition
        elif self.low is None:
            condition = high_condition
        else:
            condition = f"{low_condition} && {high_condition}"

        jsonpath_selector = make_jsonpath_selector(path_selector)
        return f"{jsonpath_selector} ? ({condition})"

