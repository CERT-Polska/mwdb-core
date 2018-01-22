import sys
import enum
import sqlalchemy
from sqlalchemy.sql import func
from collections import defaultdict

import db.query as query
from db.malware.models import *


def typ_error(str):
    raise TypeError(str)


def ssdeep_sim(a, b):
    hash, sim = b.split(',')
    sim = int(sim)
    return func.fuzzy_hash_compare(a, hash) > sim


class base_ops(defaultdict):
    def __init__(self, v):
        vals = [('=', lambda a, b: a == b)] + v

        def def_f(a, b): return type_error('you cant do it')
        super(base_ops, self).__init__(def_f, vals)


likable_ops = base_ops([('like', lambda a, b: a.like(b))])
tag_ops = defaultdict(lambda a, b: type_error('you cant do it'),
                      [('=', lambda a, b:a.any(Tag.tag == b.lower()))]
                      )
ssdeep_ops = base_ops([('~', ssdeep_sim)])
source_ops = base_ops([('like', lambda a, b: a.any(Source.source.like(b)))])


class MalwareQuery(query.Query):
    def __init__(self, q):
        ctx = {'tag': tag_ops, 'source': source_ops, 'ssdeep': ssdeep_ops,
               'file_name': likable_ops, 'file_type': likable_ops, 'comment': likable_ops,
               }
        return super(MalwareQuery, self).__init__(q, ctx, Malware)
#    def run(self,s):#
#	return s.query(Malware.created_at,Malware.sha256).filter(self.parse()).all()
