import re
from typing import List, Optional, Pattern, Tuple, TypeVar

from luqum.tree import Item, Term
from sqlalchemy import and_, true
from sqlalchemy.sql.expression import ColumnElement

T = TypeVar("T", bound=Item)

PathSelector = List[Tuple[str, int]]


def parse_field_path(field_path: str) -> PathSelector:
    """
    Extract subfields from fields path with proper control character handling:

    - \\x - escaped character
    - * - array element reference e.g. (array*:2)
    - . - field separator
    """
    fields = [""]
    last_pos = 0

    for match in re.finditer(r"\\.|[.]|[*]+(?:[.]|$)", field_path):
        control_char = match.group(0)
        control_char_pos, next_pos = match.span(0)
        # Append remaining characters to the last field
        fields[-1] = fields[-1] + field_path[last_pos:control_char_pos]
        last_pos = next_pos
        # Check control character
        if control_char[0] == "\\":
            # Escaped character
            fields[-1] = fields[-1] + control_char[1]
        elif control_char == ".":
            # End of field
            fields.append("")
        elif control_char[0] == "*":
            # Terminate field as a tuple with count of trailing asterisks
            fields[-1] = (fields[-1], control_char.count("*"))
            # End of field with trailing asterisks
            if control_char[-1] == ".":
                fields.append("")

    if len(field_path) > last_pos:
        # Last field should not be a tuple at this point. If it is: something went wrong
        assert type(fields[-1]) is str
        fields[-1] = fields[-1] + field_path[last_pos:]
    return [field if type(field) is tuple else (field, 0) for field in fields]


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
        lambda m: m.group(0)[:-1] + wildcard_map[m.group(0)[-1]],
        value,
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
    control_chars = '.[]{}()^$+|"'
    value = match_unescaped(control_chars).sub(r"\\\1", value)
    # Convert all unescaped wildcards
    value = match_unescaped("*?").sub(
        lambda m: m.group(0)[:-1] + wildcard_map[m.group(0)[-1]], value
    )
    # Double all backslashes
    return value


def jsonpath_quote(value: str) -> str:
    """
    Quotes field to be correctly represented in jsonpath
    """
    # Escape all double quotes and backslashes
    value = match_unescaped('"').sub(r"\\\1", value)
    return f'"{value}"'


def make_jsonpath_selector(path_selector: PathSelector) -> str:
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


def has_wildcard(value):
    return Term.WILDCARDS_PATTERN.search(value) is not None


def string_equals(column: ColumnElement, value: str):
    if has_wildcard(value):
        escaped_value = escape_for_like_statement(value)
        return column.like(escaped_value)
    else:
        unescaped_value = unescape_string(value)
        return column == unescaped_value


def jsonpath_string_equals(path_selector: PathSelector, value: str) -> str:
    if has_wildcard(value):
        escaped_value = escape_for_jsonpath_regex_statement(value)
        condition = f'@ like_regex "{escaped_value}"'
    elif is_nonstring_object(value):
        condition = f"@ == {jsonpath_quote(value)} || @ == {value}"
    else:
        condition = f"@ == {jsonpath_quote(value)}"

    jsonpath_selector = make_jsonpath_selector(path_selector)
    return f"{jsonpath_selector} ? ({condition})"


def escaped_unicode_escape(value: str) -> str:
    """
    Configurations are additionally escaped using unicode_escape,
    so we have normalized representation of non-ASCII characters
    that is independent from database representation.
    As we don't unescape anything during escaping transformation,
    we need to additionally escape slashes added by unicode_escape,
    but leave the original slashes unchanged
    """
    def escape(char: str) -> str:
        # unicode_escape encodes single slash as double slash
        if char == "\\":
            return "\\\\"
        # Don't encode single slash
        encoded = char.encode("unicode_escape").decode()
        if encoded != char and encoded.startswith("\\"):
            return "\\" + encoded
        else:
            return char
    return ''.join([escape(c) for c in value])


U = TypeVar("U")


def range_equals(
    column: ColumnElement,
    low: Optional[U],
    high: Optional[U],
    include_low: bool,
    include_high: bool,
):

    # Swap boundaries if both defined and low > high
    if low is not None and high is not None and low > high:
        low, high = high, low
        include_low, include_high = include_high, include_low
    if high is None and low is None:
        return true()
    if low is not None:
        low_condition = column >= low if include_low else column > low
    if high is not None:
        high_condition = column <= high if include_high else column < high
    if high is None:
        return low_condition
    if low is None:
        return high_condition
    return and_(low_condition, high_condition)


def jsonpath_range_equals(
    path_selector: List[Tuple[str, int]],
    low: Optional[U],
    high: Optional[U],
    include_low: bool,
    include_high: bool,
) -> str:
    # Swap boundaries if both defined and low > high
    if low is not None and high is not None and low > high:
        low, high = high, low
        include_low, include_high = include_high, include_low

    low_condition = f"@ >= {low}" if include_low else f"@ > {low}"
    high_condition = f"@ <= {high}" if include_high else f"@ < {high}"

    if high is None and low is None:
        condition = "@"
    elif high is None:
        condition = low_condition
    elif low is None:
        condition = high_condition
    else:
        condition = f"{low_condition} && {high_condition}"

    jsonpath_selector = make_jsonpath_selector(path_selector)
    return f"{jsonpath_selector} ? ({condition})"
