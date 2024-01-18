from luqum.tree import Word, Phrase, Item, Term
from .exceptions import UnsupportedGrammarException


class Value:
    def __init__(self, node: Item):
        self.node = node
        self.value = self._get_value()

    def _get_value(self):
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
