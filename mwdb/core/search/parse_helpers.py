import re
from enum import Enum
from typing import Iterable, Iterator, List, Optional, Pattern, Tuple, TypeVar

from luqum.tree import Item, Term
from sqlalchemy import and_, true
from sqlalchemy.sql.expression import ColumnElement

T = TypeVar("T", bound=Item)

PathSelector = List[Tuple[str, int]]


class TokenType(Enum):
    STRING = "string"
    ESCAPE = "escape"
    CONTROL = "control"


StringToken = Tuple[TokenType, str]


def tokenize_string(value: str, control_chars: str) -> Iterator[StringToken]:
    """
    Parses backslash-escaped string value into list of tokens:
        - ("string", "...") for regular string part
        - ("escape", "\\?") for backslash-escaped character
        - ("control", "?") for non-escaped control character for control_chars string
    """
    # Ensure that \ is not a control character because it makes things
    # more complicated. Lucene doesn't allow for unescaped \ anyway
    assert "\\" not in control_chars
    if control_chars:
        # Escape regex control characters in set of control characters
        # to be safely put in square brackets [...]
        re_control_chars = re.sub(r"([\^\-\]])", r"\\\1", control_chars)
        pattern = rf"[{re_control_chars}]|\\."
    else:
        pattern = r"\\."
    current_pos = 0
    for match in re.finditer(pattern, value):
        start, end = match.span(0)
        if current_pos < start:
            yield TokenType.STRING, value[current_pos:start]
        if value[match.pos] == "\\":
            yield TokenType.ESCAPE, value[start:end]
        else:
            yield TokenType.CONTROL, value[start:end]
        current_pos = end
    if current_pos < len(value):
        yield TokenType.STRING, value[current_pos:]


def join_tokenized_string(tokenized_string: Iterable[StringToken]) -> str:
    return "".join(s for _, s in tokenized_string)


def split_tokenized_string(
    tokenized_string: List[StringToken], separator: StringToken
) -> List[List[StringToken]]:
    last_index = 0
    for sep_index in [
        idx for idx, token in enumerate(tokenized_string) if token == separator
    ]:
        yield tokenized_string[last_index:sep_index]
    yield tokenized_string[last_index : len(tokenized_string)]


def unescape_tokenized_string(
    tokenized_string: Iterable[StringToken],
) -> Iterator[StringToken]:
    return (
        (TokenType.STRING, token[1:])
        if token_type is TokenType.ESCAPE
        else (token_type, token)
        for token_type, token in tokenized_string
    )


def parse_field_path(field_path: str) -> PathSelector:
    """
    Extract subfields from fields path with proper control character handling:

    - \\x - escaped character
    - * - array element reference e.g. (array*:2)
    - . - field separator
    """
    path_selector: PathSelector = []
    tokenized_string = tokenize_string(field_path, "*.")
    path_elements = split_tokenized_string(
        list(tokenized_string), (TokenType.CONTROL, ".")
    )
    for path_element in path_elements:
        asterisk_count = 0
        for asterisk_count, token in enumerate(reversed(path_element)):
            if token != (TokenType.CONTROL, "*"):
                break
        element_name = unescape_tokenized_string(path_element[:-asterisk_count])
        path_selector.append((join_tokenized_string(element_name), asterisk_count))
    return path_selector


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


def _encode_for_like_statement(escaped_value: str) -> Iterator[StringToken]:
    """
    Tokenization and token transform for LIKE (SQL) statement
    """

    def transform_token(token: StringToken) -> StringToken:
        # Transform Lucene wildcards to SQL wildcards
        if token == (TokenType.CONTROL, "*"):
            return TokenType.CONTROL, "%"
        elif token == (TokenType.CONTROL, "?"):
            return TokenType.CONTROL, "_"
        # Transform SQL unescaped wildcards to escaped SQL wildcards
        elif token in [(TokenType.CONTROL, "%"), (TokenType.ESCAPE, "\\%")]:
            # This escaped character is intentionally a control character
            # as we should not mess with that escaping
            return TokenType.CONTROL, "\\%"
        elif token == [(TokenType.CONTROL, "_"), (TokenType.ESCAPE, "\\_")]:
            return TokenType.CONTROL, "\\_"
        return token

    tokenized_string = tokenize_string(escaped_value, "*?%_")
    return (transform_token(token) for token in tokenized_string)


def _encode_for_config_match(
    tokenized_string: Iterable[StringToken],
) -> Iterator[StringToken]:
    r"""
    Configurations are encoded using .encode("unicode-escape") to represent non-ASCII
    characters in unified way that is not determined by database representation.

    It means that for == statements, escaped string control characters like
    \n \t \r must stay escaped and other strings must be transformed using
    unicode-escape.

    For LIKE statements, backslashes introduced by escaping mentioned above
    must be doubled to represent backslashes in string.
    """

    def transform_unicode_escape(token: StringToken) -> StringToken:
        token_type, token_value = token
        if token_type is TokenType.STRING:
            return TokenType.STRING, token_value.encode("unicode-escape").decode()
        elif token_type is TokenType.ESCAPE:
            unicode_escape_control_chars = [
                r"\\",
                r"\t",
                r"\n",
                r"\r",
                r"\x",
                r"\u",
                r"\U",
            ]
            if token_value in unicode_escape_control_chars:
                # Take these escaped characters as literal backslash and letter
                # Other characters can be unescaped
                return TokenType.STRING, token_value
        # CONTROL tokens and other ESCAPE tokens should be left unchanged
        return token

    return (transform_unicode_escape(token) for token in tokenized_string)


def transform_for_like_statement(escaped_value: str) -> str:
    """
    Transforms Lucene value to pattern for LIKE condition
    Gets escaped Lucene value, transforms wildcards into SQL wildcards,
    transforms original SQL wildcards into escaped characters and unescapes
    all the others
    """
    tokenized_string = _encode_for_like_statement(escaped_value)
    return join_tokenized_string(unescape_tokenized_string(tokenized_string))


def transform_for_config_like_statement(escaped_value: str) -> str:
    """
    Transforms Lucene value to pattern for LIKE condition against
    "unicode-escape"-escaped JSON value
    """
    tokenized_string = _encode_for_like_statement(escaped_value)
    unicode_escaped_string = _encode_for_config_match(tokenized_string)
    return join_tokenized_string(unescape_tokenized_string(unicode_escaped_string))


def transform_for_config_eq_statement(escaped_value: str) -> str:
    """
    Transforms Lucene value to value for == condition against
    "unicode-escape"-escaped JSON value
    """
    # No control characters for == statement
    tokenized_string = tokenize_string(escaped_value, "")
    unicode_escaped_string = _encode_for_config_match(tokenized_string)
    return join_tokenized_string(unescape_tokenized_string(unicode_escaped_string))


def unescape_string(value: str) -> str:
    return re.sub(r"\\(.)", r"\1", value)


def jsonpath_quote(value: str) -> str:
    """
    Quotes field to be correctly represented in jsonpath
    """
    # Escape all double quotes and backslashes
    value = match_unescaped('\\"').sub(r"\\\1", value)
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


def string_equals(column: ColumnElement, escaped_value: str):
    if has_wildcard(escaped_value):
        pattern = transform_for_like_statement(escaped_value)
        return column.like(pattern)
    else:
        unescaped_value = unescape_string(escaped_value)
        return column == unescaped_value


def config_string_equals(column: ColumnElement, escaped_value: str):
    if has_wildcard(escaped_value):
        pattern = transform_for_config_like_statement(escaped_value)
        return column.like(pattern)
    else:
        value = transform_for_config_eq_statement(escaped_value)
        return column == value


def _jsonpath_string_equals(path_selector: PathSelector, value: str) -> str:
    if is_nonstring_object(value):
        condition = f"@ == {jsonpath_quote(value)} || @ == {value}"
    else:
        condition = f"@ == {jsonpath_quote(value)}"

    jsonpath_selector = make_jsonpath_selector(path_selector)
    return f"{jsonpath_selector} ? ({condition})"


def jsonpath_string_equals(path_selector: PathSelector, escaped_value: str) -> str:
    # Wildcards are not supported, everything here is taken literally
    value = unescape_string(escaped_value)
    return _jsonpath_string_equals(path_selector, value)


def jsonpath_config_string_equals(
    path_selector: PathSelector, escaped_value: str
) -> str:
    # Wildcards are not supported, everything here is taken literally
    value = transform_for_config_eq_statement(escaped_value)
    return _jsonpath_string_equals(path_selector, value)


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
