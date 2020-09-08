from luqum.tree import FieldGroup


class Subquery(FieldGroup):
    def __init__(self, expr, subquery):
        super().__init__(expr)
        self.subquery = subquery
