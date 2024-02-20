from typing import NamedTuple, Optional

from luqum.tree import From, Item, OpenRange, Phrase, Range, To, Word

from .exceptions import UnsupportedNodeTypeException, UnsupportedPatternValue
from .parse_helpers import is_pattern_value


class RangeValue(NamedTuple):
    low: Optional[str]
    high: Optional[str]
    include_low: bool
    include_high: bool


def string_from_node(node: Item, escaped: bool = False) -> str:
    if isinstance(node, Word):
        return node.value if escaped else node.unescaped_value
    elif isinstance(node, Phrase):
        # Remove quotes from the beginning and the end of Phrase
        return node.value[1:-1] if escaped else node.unescaped_value[1:-1]
    else:
        raise UnsupportedNodeTypeException(node)


def range_from_range_node(
    node: Range,
) -> RangeValue:
    low_value = string_from_node(node.low)
    if low_value == "*":
        low_value = None
    elif is_pattern_value(low_value):
        raise UnsupportedPatternValue(node.low)

    high_value = string_from_node(node.high)
    if high_value == "*":
        high_value = None
    elif is_pattern_value(high_value):
        raise UnsupportedPatternValue(node.high)

    return RangeValue(low_value, high_value, node.include_low, node.include_high)


def range_from_openrange_node(
    node: OpenRange,
) -> RangeValue:
    value = string_from_node(node.a)
    if value == "*":
        value = None
    elif is_pattern_value(value):
        raise UnsupportedPatternValue(node.a)

    if isinstance(node, From):
        return RangeValue(value, None, node.include, False)
    elif isinstance(node, To):
        return RangeValue(None, value, False, node.include)
    else:
        raise UnsupportedNodeTypeException(node)


def range_from_node(node: Item) -> RangeValue:
    if isinstance(node, Range):
        return range_from_range_node(node)
    elif isinstance(node, OpenRange):
        return range_from_openrange_node(node)
    else:
        raise UnsupportedNodeTypeException(node)


def node_is_range(node: Item) -> bool:
    return isinstance(node, (Range, OpenRange))
