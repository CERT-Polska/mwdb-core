import ast
import pyparsing
import operator
import sqlalchemy.sql as sql
from sqlalchemy import not_

'''
grammar:

@field := @[a-zA-Z0-9_\-]+
@value := [^ ]+ | "[^ \"]" 
@bool_op := or | and 
@eq_op := = | > | < | <= | >= | ~ | like
@term := @field @eq_op @value  | not @expr
@expr := @term (@bool_op @term)*

'''

def type_error(str):
    raise TypeError(str)


class Query(object):
    _ops = {'=': operator.eq, '>': operator.gt,
            '<': operator.lt, '<=': operator.le, '>=': operator.ge,
            'like': lambda a, b: type_error('This cannot be liked'),
            '~': lambda a, b: type_error('This cannot be similar')
            }

    def __init__(self, string, context, model):
        self.string = string
        self.context = context
        self.stack = []
        self.model = model

    def mk_term(self, strg, loc, toks):

        if toks[2] in self.context.get(toks[1], {}):
            op = self.context[toks[1]][toks[2]]
        else:
            op = self._ops[toks[2]]

        f = getattr(self.model, toks[1])
        try:
            v = ast.literal_eval(toks[3])
        except:
            v = toks[3]

        self.stack.append(op(f, v))

    def mk_expr(self, strg, loc, toks):
        op = toks[0]
        if op == 'not':
            e1 = self.stack.pop()
            self.stack.append(not_(e1))
        else:
            e1 = self.stack.pop()
            e2 = self.stack.pop()
            self.stack.append(getattr(sql, op + '_')(e1, e2))

    def get_parser(self):
        field = pyparsing.Literal('@') + pyparsing.Regex('[a-zA-Z0-9_]+')
        value = pyparsing.dblQuotedString | pyparsing.Word(pyparsing.alphanums)
        bool_op = pyparsing.oneOf(['or', 'and'])
        eq_op = pyparsing.oneOf(['=', '>', '<', '<=', '>=', '~', 'like'])
        expr = pyparsing.Forward()
        term = (field + eq_op + value).setParseAction(self.mk_term) | \
               (pyparsing.Word('not') + expr).setParseAction(self.mk_expr)
        expr << term + pyparsing.ZeroOrMore((bool_op + term).setParseAction(self.mk_expr))
        return expr

    def parse(self):
        p = self.get_parser().parseString(self.string)
        return self.stack.pop()

    def run(self, session):
        return session.query(self.model).filter(self.parse())


