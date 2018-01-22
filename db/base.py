import enum

from datetime import datetime
from libs.objects import File, Config, Singleton

from sqlalchemy import create_engine,and_,or_
from sqlalchemy.pool import NullPool
from sqlalchemy.engine import reflection
from sqlalchemy.orm import relationship, backref,sessionmaker,configure_mappers
from sqlalchemy import ForeignKey, Table, Column, Index
from sqlalchemy import Integer, String, Boolean, DateTime, Enum, Text

from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method

from db.decorators import searchable,taggable


class _Base(object):
    
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower() + 's'
    
    def to_dict(self):
        row_dict = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            row_dict[column.name] = value

        return row_dict

    @property
    def tags(self):
        return map(lambda x: x.tag, self._tags)

ADMIN_USERS = Config('api.conf').api.admins.split(",")
class OwnedMixIn(object):

    sharable = Column(Boolean(), default=True)

    
    @property
    def owners(self):
        return map(lambda x: x.login, self._owners)
    
    @hybrid_method
    def _is_sharable(self, user):
        return user in ADMIN_USERS or self.sharable

    @hybrid_method
    def is_sharable(self, user):
        return self._is_sharable(user) or user in self._owners

    @is_sharable.expression
    def is_sharable(self, user):
        return or_(self._is_sharable(user), self._owners.any(User.login == user))
        

    
Base = declarative_base(cls=_Base)
InsertRet = enum.IntEnum('InsertRet', 'ok duplicate error')


class User(Base):

    id = Column(Integer(), primary_key=True)
    login = Column(Text(),unique=True)
    email = Column(Text())
    password = Column(Text(),nullable=True)
    is_admin = Column(Boolean(), default=False)

    def __init__(self,login,email,passwd,is_admin=False):
        self.login = login
        self.email = email
        self.password = passwd
        self.is_admin = is_admin
    
    def __eq__(self,u):
        return self.login == u

    def __getitem__(self):
        return self.login

class Tag(Base):
    
    id = Column(Integer(), primary_key=True)
    tag = Column(String(255), nullable=False, unique=True, index=True)

    def __repr__(self):
        return "<Tag ('%s','%s'>" % (self.id, self.tag)

    def __init__(self, tag):
        self.tag = tag


class Name(Base):
    
    id = Column(Integer(), primary_key=True)
    name = Column(String(256), nullable=True,unique=True)

    def __init__(self,name):
        self.name = name
        
class MixTag:

    def tag_get(self,t):
        return self.session.query(Tag).filter_by(tag=t).first()
    
    def tag_append(self, o, tags):
        tags = tags.strip()
        if "," in tags:
            tags = tags.split(",")
        else:
            tags = tags.split(" ")

        for tag in tags:
            tag = tag.strip().lower()
            if tag == "":
                continue

            self.tag_insert(o, tag)

    def tag_insert(self, o, tag):
        ret, t = self.save_object(Tag(tag))
        if t:
            o._tags.append(t)
    
    def add_tag(self, o, t):
        self.tag_append(o, t)
        self.session.commit()


    def tag_list(self):
        return self.session.query(Tag).all()

    def tag_find_tagged(self,tag):
        t = self.tag_get(tag)
        r = {}
        for o in t.__mapper__.relationships.keys() if t else []:
            r[o] = getattr(t,o)
            
        return r
    
class BaseMixIn(object):

    __metaclass__ = Singleton

    def __init__(self, cfg='api.conf'):
        self.engine = create_engine(
            Config(cfg).api.database, poolclass=NullPool)
        self.engine.echo = False
        self.engine.pool_timeout = 60
        configure_mappers()
        
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.inspector=reflection.Inspector.from_engine(self.engine)
        self._session = None
        self.user = None
        self.uniq_cache = {}

    def unique_field(self,table):
        f = self.uniq_cache.get(table,None)
        if not f:
            for uq in self.inspector.get_unique_constraints(table):
                f = uq['column_names']
                self.uniq_cache[table] = f
                break
        if not f:
            for idx in self.inspector.get_indexes(table):
                if idx['unique']:
                    f =idx['column_names']
                    break
        return f
        
    def __del__(self):
        self.engine.dispose()
        
    @property
    def session(self):
        if not self._session:
            self._session = self.Session()
        return self._session

    def save_object(self,obj):
        klass = obj.__class__
        obj_entry= obj
        exists = False
        try:
            print obj
            
            self.session.add(obj)
            self.session.commit()
        except IntegrityError as e:
            ## object exists
            self.session.rollback()
            
            uniq = self.unique_field(klass.__tablename__)
            if not uniq:
                uniq = map(lambda x: '_'+x.name if hasattr(obj,'_'+x.name) else x.name,obj.__mapper__.primary_key)
                
            uniq_f = ( getattr(klass,n) for n in uniq)
            uniq_v = ( getattr(obj,n) for n in uniq)
            filtr = reduce(lambda acc,v: and_(acc,v[0] == v[1]),
                    zip(uniq_f,uniq_v),True)
            obj_entry = self.session.query(klass).filter(filtr).first()
            exists = True
        except SQLAlchemyError as e:
            self.session.rollback()
            import traceback
            traceback.print_exc()
            
            return (InsertRet.error, None)        
        return (InsertRet.duplicate if exists else InsertRet.ok, obj_entry)
    
    def set_user(self, user):
        self.user = user

    def name_find_named(self,name):
        q=self.session.query(Name).filter(Name.name.like('%'+name+'%'))
        for n in q.all():
            print n.name,n.objects
            print n.name,n.attachments
        
class DbBase(BaseMixIn,MixTag):
    pass
