import re
from enum import Enum
from typing import Iterable, Iterator, List, Optional, Tuple, TypeVar

from luqum.tree import Item, Term
from sqlalchemy import and_, true
from sqlalchemy.sql.expression import ColumnElement

T = TypeVar("T", bound=Item)

PathSelector = List[Tuple[str, int]]


class TokenType(Enum):
    STRING = "string"
    CONTROL = "control"


StringToken = Tuple[TokenType, str]


def tokenize_string(
    value: str, control_chars: str, control_escapes: str = ""
) -> Iterator[StringToken]:
    """
    Parses backslash-escaped string value into list of tokens:
        - ("string", "...") for regular string part
        - ("control", "?") for non-escaped control character for control_chars string
        - ("control", "\\?") for escaped control characters for control_escapes string
    "string" nodes are unescaped.

    control_chars are regular characters that are
    treated as control characters when unescaped

    control_escapes are special escape characters that are
    marked as control characters when escaped
    """
    # WARNING: Ensure that \ is not passed as a control character.
    # Lucene doesn't allow for unescaped \ anyway
    if control_chars:
        # Escape regex control characters in set of control characters
        # to be safely put in square brackets [...]
        re_control_chars = re.sub(r"([\^\-\]])", r"\\\1", control_chars)
        pattern = rf"[{re_control_chars}]|\\."
    else:
        pattern = r"\\."

    current_pos = 0
    current_string = ""

    for match in re.finditer(pattern, value):
        start, end = match.span(0)
        if current_pos < start:
            current_string += value[current_pos:start]
        if value[start] == "\\":
            escaped_char = value[start + 1]
            if escaped_char in control_escapes:
                if current_string:
                    yield TokenType.STRING, current_string
                    current_string = ""
                yield TokenType.CONTROL, value[start:end]
            else:
                current_string += value[start + 1 : end]
        else:
            if current_string:
                yield TokenType.STRING, current_string
                current_string = ""
            yield TokenType.CONTROL, value[start:end]
        current_pos = end

    if current_pos < len(value):
        current_string += value[current_pos:]
    if current_string:
        yield TokenType.STRING, current_string


def join_tokenized_string(tokenized_string: Iterable[StringToken]) -> str:
    return "".join(s for _, s in tokenized_string)


def split_tokenized_string(
    tokenized_string: List[StringToken], separator: StringToken
) -> Iterator[List[StringToken]]:
    last_index = 0
    for sep_index in [
        idx for idx, token in enumerate(tokenized_string) if token == separator
    ]:
        yield tokenized_string[last_index:sep_index]
        last_index = sep_index + 1
    yield tokenized_string[last_index : len(tokenized_string)]


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
        # Asterisks at the end of field are used for unnesting arrays
        # in JSON fields. We need to count them and remove them from
        # field name.
        asterisk_count = 0
        for asterisk_count, token in enumerate(reversed(path_element)):
            if token != (TokenType.CONTROL, "*"):
                break
        element_name = (
            path_element[:-asterisk_count] if asterisk_count > 0 else path_element
        )
        path_selector.append((join_tokenized_string(element_name), asterisk_count))
    return path_selector


def unescape_string(value: str) -> str:
    return re.sub(r"\\(.)", r"\1", value)


def transform_for_regular_statement(escaped_value: str) -> str:
    return unescape_string(escaped_value)


def transform_for_like_statement(escaped_value: str) -> str:
    """
    Transforms Lucene value to pattern for LIKE condition
    Gets escaped Lucene value, transforms wildcards into SQL wildcards and
    transforms original SQL wildcards and backslashes into escaped characters
    """

    def transform_token(token: StringToken) -> StringToken:
        token_type, token_value = token
        # Transform Lucene wildcards to SQL wildcards
        if token == (TokenType.CONTROL, "*"):
            return TokenType.CONTROL, "%"
        elif token == (TokenType.CONTROL, "?"):
            return TokenType.CONTROL, "_"
        elif token_type is TokenType.STRING:
            value = re.sub(r"([%_\\])", r"\\\1", token_value)
            return TokenType.STRING, value

    tokenized_string = tokenize_string(escaped_value, "*?")
    transformed_string = (transform_token(token) for token in tokenized_string)
    return join_tokenized_string(transformed_string)


def transform_for_quoted_like_statement(
    escaped_value: str, escape_quotes: bool = True
) -> str:
    """
    Transforms Lucene value to pattern for LIKE condition
    against stringified JSON values
    """

    def transform_token(token: StringToken) -> StringToken:
        token_type, token_value = token
        # Transform Lucene wildcards to SQL wildcards
        if token == (TokenType.CONTROL, "*"):
            return TokenType.CONTROL, "%"
        elif token == (TokenType.CONTROL, "?"):
            return TokenType.CONTROL, "_"
        elif token_type is TokenType.STRING:
            # Escape all backslashes and quotes to correctly represent
            # these characters in quoted string
            value = re.sub(
                r'(["\\])' if escape_quotes else r"([\\])", r"\\\1", token_value
            )
            # Then escape SQL wildcards (for LIKE) and
            # once again escape all backslashes
            value = re.sub(r"([%_\\])", r"\\\1", value)
            return TokenType.STRING, value

    tokenized_string = tokenize_string(escaped_value, "*?")
    transformed_string = (transform_token(token) for token in tokenized_string)
    return join_tokenized_string(transformed_string)


def transform_for_config_regular_statement(escaped_value: str) -> str:
    """
    Transforms Lucene value to value for == condition against
    "unicode-escape"-escaped JSON value

    Configurations are encoded using .encode("unicode-escape") to represent non-ASCII
    characters in unified way that is not determined by database representation.

    It means that for == statements, escaped string control characters like
    \n \t \r must stay escaped and other strings must be transformed using
    unicode-escape.

    For LIKE statements, backslashes introduced by escaping mentioned above
    must be doubled to represent backslashes in string.
    """

    def transform_token(token: StringToken) -> StringToken:
        token_type, token_value = token
        if token_type is TokenType.STRING:
            # C:\Users => "C:\\\\Users"
            return TokenType.STRING, token_value.encode("unicode-escape").decode()
        elif token_type is TokenType.CONTROL:
            # \n => "\\n"
            return TokenType.STRING, token_value

    tokenized_string = tokenize_string(escaped_value, "", control_escapes="tnrxuU")
    unicode_escaped_string = (transform_token(token) for token in tokenized_string)
    return join_tokenized_string(unicode_escaped_string)


def transform_for_config_like_statement(escaped_value: str) -> str:
    """
    Transforms Lucene value to pattern for LIKE condition against
    "unicode-escape"-escaped JSON value
    """

    def transform_token(token: StringToken) -> StringToken:
        token_type, token_value = token
        # Transform Lucene wildcards to SQL wildcards
        if token == (TokenType.CONTROL, "*"):
            return TokenType.CONTROL, "%"
        elif token == (TokenType.CONTROL, "?"):
            return TokenType.CONTROL, "_"
        elif token_type is TokenType.CONTROL:
            # Additionally escape backslashes in control_escapes
            return TokenType.STRING, token_value.replace("\\", "\\\\")
        elif token_type is TokenType.STRING:
            # Encode value using unicode-escape
            value = token_value.encode("unicode-escape").decode()
            # Escape all backslashes and SQL wildcards
            value = re.sub(r"([%_\\])", r"\\\1", value)
            return TokenType.STRING, value

    tokenized_string = list(
        tokenize_string(escaped_value, "*?", control_escapes="tnrxuU")
    )
    transformed_string = list(transform_token(token) for token in tokenized_string)
    return join_tokenized_string(transformed_string)


def transform_for_quoted_config_like_statement(
    escaped_value: str, escape_quotes: bool = True
) -> str:
    """
    Transforms Lucene value to pattern for LIKE condition against
    "unicode-escape"-escaped stringified JSON value
    """

    def transform_token(token: StringToken) -> StringToken:
        token_type, token_value = token
        # Transform Lucene wildcards to SQL wildcards
        if token == (TokenType.CONTROL, "*"):
            return TokenType.CONTROL, "%"
        elif token == (TokenType.CONTROL, "?"):
            return TokenType.CONTROL, "_"
        elif token_type is TokenType.CONTROL:
            # Additionally escape backslashes in control_escapes
            # We need four backslashes - first level for LIKE and
            # second level for JSON string
            return TokenType.STRING, token_value.replace("\\", "\\" * 4)
        elif token_type is TokenType.STRING:
            # Encode value using unicode-escape
            value = token_value.encode("unicode-escape").decode()
            # Additionally escape backslashes in control_escapes
            # We need four backslashes - first level for LIKE
            # and second level for JSON string
            value = value.replace("\\", "\\" * 4)
            # Escape inner quotes
            if escape_quotes:
                value = value.replace('"', ("\\" * 2) + '"')
            # Finally escape all SQL wildcards with only LIKE-level backslashes
            value = re.sub(r"([%_])", r"\\\1", value)
            return TokenType.STRING, value

    tokenized_string = list(
        tokenize_string(escaped_value, "*?", control_escapes="tnrxuU")
    )
    transformed_string = list(transform_token(token) for token in tokenized_string)
    return join_tokenized_string(transformed_string)


def jsonpath_quote(value: str) -> str:
    """
    Quotes field to be correctly represented in jsonpath
    """
    # Escape all double quotes and backslashes
    value = re.sub(r'([\\"])', r"\\\1", value)
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
    return bool(re.fullmatch(r"(false|true|null|(0|[1-9]\d*)([.]\d+)?)", value))


def is_inner_match_pattern(value: str) -> bool:
    """
    Checks if pattern starts and ends with unescaped wildcard '*'
    """
    wildcard_pattern = r"((?<=[^\\])[*]|\\\\[*]|^[*])"  # non escaped *
    if not re.search("^" + wildcard_pattern, value):
        return False
    if not re.search(wildcard_pattern + "$", value):
        return False
    return True


def ensure_inner_match_pattern(value: str) -> str:
    """
    Ensures that pattern starts and ends with unescaped wildcard '*'
    """
    wildcard_pattern = r"((?<=[^\\])[*]|\\\\[*]|^[*])"  # non escaped *
    pattern = value
    if not re.search("^" + wildcard_pattern, value):
        pattern = "*" + pattern
    if not re.search(wildcard_pattern + "$", value):
        pattern = pattern + "*"
    return pattern


def is_pattern_value(value) -> bool:
    """
    Returns True if value contains wildcards
    """
    return Term.WILDCARDS_PATTERN.search(value) is not None


def string_equals(column: ColumnElement, escaped_value: str):
    if is_pattern_value(escaped_value):
        pattern = transform_for_like_statement(escaped_value)
        return column.like(pattern)
    else:
        value = transform_for_regular_statement(escaped_value)
        return column == value


def config_string_equals(column: ColumnElement, escaped_value: str):
    if is_pattern_value(escaped_value):
        pattern = transform_for_config_like_statement(escaped_value)
        return column.like(pattern)
    else:
        value = transform_for_config_regular_statement(escaped_value)
        return column == value


def _jsonpath_string_equals(path_selector: PathSelector, value: str) -> str:
    if is_nonstring_object(value):
        condition = f"@ == {jsonpath_quote(value)} || @ == {value}"
    else:
        condition = f"@ == {jsonpath_quote(value)}"

    jsonpath_selector = make_jsonpath_selector(path_selector)
    return f"{jsonpath_selector} ? ({condition})"


def jsonpath_string_equals(path_selector: PathSelector, escaped_value: str) -> str:
    # Wildcards are not supported
    value = transform_for_regular_statement(escaped_value)
    return _jsonpath_string_equals(path_selector, value)


def jsonpath_config_string_equals(
    path_selector: PathSelector, escaped_value: str
) -> str:
    # Wildcards are not supported
    value = transform_for_config_regular_statement(escaped_value)
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

    if low is not None and not is_nonstring_object(low):
        low = transform_for_regular_statement(low)
        low = jsonpath_quote(low)

    if high is not None and not is_nonstring_object(high):
        high = transform_for_regular_statement(high)
        high = jsonpath_quote(high)

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
