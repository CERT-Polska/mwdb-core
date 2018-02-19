import sys

from libs.objects import File, Config
from datetime import datetime
from db.base import Base,Tag,User,OwnedMixIn

from db.decorators import viewable

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, ForeignKey, Table, Index
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from sqlalchemy import and_, or_, func, select, exists
from sqlalchemy.orm import relationship, backref, sessionmaker, aliased
from sqlalchemy.sql import column




class VTComment(Base):

    id = Column('id', Integer, primary_key=True)
    obj_id = Column(Integer,ForeignKey('objects.id'),nullable=True)
    hash = Column(String(64), nullable=False, index=True)
    cmnt = Column(Text(), nullable=True)
    date = Column(DateTime(timezone=False),
                  default=datetime.utcnow, nullable=False)
    user = Column(Text(), nullable=True)
    type = Column(Text(), nullable=True)


class ObjectCuckoo(Base):
    __tablename__ = 'object_cuckoo'

    id = Column('cuckoo_id', Integer)
    m = Column('mid', Integer, ForeignKey('objects.id'))
    __mapper_args__ = {"primary_key": (id, m)}

    def __init__(self, id):
        self.id = id



file_names = Table('file_names', Base.metadata,
                Column('n', Integer, ForeignKey('names.id')),
                Column('o', Integer, ForeignKey('objects.id'))
)

association_table = Table('obj_tag', Base.metadata,
                          Column('t', Integer, ForeignKey('tags.id')),
                          Column('o', Integer,ForeignKey('objects.id'))
                          )

obj_user = Table('obj_user', Base.metadata,
                    Column('o', Integer, ForeignKey('objects.id')),
                    Column('u', Integer, ForeignKey('users.id')),
          
)

xrefs = Table('xrefs', Base.metadata,
              Column('parent', Integer, ForeignKey('objects.id')),
              Column('child', Integer, ForeignKey('objects.id')),
)


@viewable('sha256')
class Object(Base,OwnedMixIn):
    __table_args__ = (Index("hash_index",
                            "md5",
                            "sha256",
                            unique=True), )
        
    id = Column(Integer(), primary_key=True)
    size = Column(Integer(), nullable=False, index=True)
    type = Column(Text(), nullable=True)
    md5 = Column(String(32), nullable=False, index=True)
    crc32 = Column(String(8), nullable=False)
    sha1 = Column(String(40), nullable=False, index=True)
    sha256 = Column(String(64), nullable=False, index=True)
    sha512 = Column(String(128), nullable=False, index=True)
    ssdeep = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=False),
                        default=datetime.utcnow, nullable=False)
    comment = Column(Text(), nullable=True)

    children = relationship('Object', secondary=xrefs,
                            primaryjoin=xrefs.c.parent == id,
                            secondaryjoin=xrefs.c.child == id,
                            backref="parent"
                            )

    
    _names  = relationship('Name',
                       secondary=file_names,
                       backref="objects")
    
    _tags   = relationship('Tag',
                       secondary=association_table,
                       backref="objects")
    _owners = relationship('User',
                       secondary=obj_user,
                       backref="objects")
    
    _cuckoo = relationship(ObjectCuckoo)

    def __init__(self,obj,comment=None, sharable=True):
        self.md5 = obj.get_md5()
        self.sha1 = obj.get_sha1()
        self.crc32 = obj.get_crc32()
        self.sha256 = obj.get_sha256()
        self.sha512 = obj.get_sha512()
        self.size = obj.get_size()
        self.type = obj.get_type()
        self.ssdeep = obj.get_ssdeep()
        self.comment = comment
        self.sharable = sharable

    @property
    def names(self):
        return map(lambda x: x.name, self._names)

    @hybrid_method
    def get_xrefs(self, direction):
        def worker(m, r):
            for p in getattr(m, direction):
                if p in r:
                    continue

                r.add(p)
                r = r.union(worker(p, r))
            return r
        return worker(self, set())

    @get_xrefs.expression
    def get_xrefs(self, t0, t1):
        xr = func.get_xrefs(t0, t1, '123')
        ml = self.x_alias or aliased(Malware, name='ml')
        j = xr.join(ml, column('mid') == ml.id)
        return select([ml]).select_from(j)

    @hybrid_method
    def ancestors(self):
        return self.get_xrefs('parent')

    @hybrid_method
    def descendants(self):
        return self.get_xrefs('children')

    @descendants.expression
    def descendants(self):
        return self.get_xrefs('parent', 'child')

    @ancestors.expression
    def ancestors(self):
        return self.get_xrefs('child', 'parent')
