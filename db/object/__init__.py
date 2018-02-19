import sys
import enum
import sqlalchemy
from sqlalchemy import and_, or_, func, desc, asc
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func, column, select
from sqlalchemy.sql.expression import literal_column

from libs.objects import File, Config, Singleton
from datetime import datetime

from collections import defaultdict


# searching
# import query
# from db.malware.query import MalwareQuery

## import model
from db.base import Name
from db.object.models import *
from db.decorators import taggable,searchable
from db.decorators import has_cuckoo,time_sorted

@taggable
@has_cuckoo
@time_sorted
@searchable('crc32','md5','sha1','sha256','sha512','id',
            {'size':'multi'},{'type':'multi'}
)
class MixObject:


    def propagete_ownership(self,p,c):

        for o in p._owners:
            if o not in c._owners:
                c._owners.append(o)
                
        c.sharable |= p.sharable

    def object_find_via_hash(self, has):

        if type(has) == int:
            return self.object_find_id(has)
        
        elif has and not issubclass(type(has), basestring):
            # this is allready an object
            return has

        lhash = len(has)
        has = has.lower()
        if lhash == 32:
            return self.object_find_md5(has)
        elif lhash == 40:
            return self.object_find_sha1(has)
        elif lhash == 64:
            return self.object_find_sha256(has)
        elif lhash == 128:
            return self.object_find_sha512(has)
    object_get = object_find_via_hash
        
    def object_add_xref(self, p, c):
        p = self.object_find_via_hash(p)
        c = self.object_find_via_hash(c)

        if c and p:
            p.children.append(c)
            # hmm update ownership?
            self.propagete_ownership(p,c)
            self.session.commit()
            return True
        return False

    def object_add(self, obj, file_name, tags=None, comment='', sharable=True):
        obj_entry = Object(obj,sharable=sharable, comment=comment)
        ret, obj = self.save_object(obj_entry)
        
        if obj and file_name:
            if file_name not in obj.names:
                _, name = self.save_object(Name(file_name))
                obj._names.append(name)
                self.session.commit()
                
        if obj and tags:
            self.tag_append(obj_entry, tags)

        return ret,obj

