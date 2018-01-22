import hashlib,json
from datetime import datetime
from db.base import Base,Tag,OwnedMixIn
from db.network.models import URL
from db.decorators import viewable

from sqlalchemy.orm import relationship,backref
from sqlalchemy import ForeignKey, Table, Column
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy import Integer, String, DateTime, Text


cfg_url = Table('cfg_url',Base.metadata,
            Column('c',Integer,ForeignKey('configs.id')),
            Column('u',Integer,ForeignKey('urls.id')),
)

cfg_obj = Table('cfg_obj',Base.metadata,
            Column('c',Integer,ForeignKey('configs.id')),
            Column('o',Integer,ForeignKey('objects.id'),unique=True),
)

cfg_user = Table('cfg_user', Base.metadata,
                    Column('c', Integer, ForeignKey('configs.id')),
                    Column('u', Integer, ForeignKey('users.id')),
)


@viewable('type')              
class Config(Base,OwnedMixIn):

    id   = Column(Integer,primary_key=True)
    type = Column(String(16),index=True)
    comment = Column(Text(), nullable=True)

    timestamp = Column(DateTime(timezone=False),
                        default=datetime.utcnow, nullable=False)
    cfg   = Column(JSONB,nullable=False)
    dhash = Column(String(32),unique=True)

    _cncs  = relationship(URL,
                secondary=cfg_url,
                backref='configs')
    objects = relationship('Object',
                secondary=cfg_obj,
                backref=backref('config',uselist=False))

    _owners = relationship('User',
                secondary=cfg_user,
                backref="configs")

    
    def __init__(self,cfg):
        self.type = cfg['type']
        self.cfg  = cfg
        self.dhash = self.get_dhash()

    def get_dhash(self):
        x=json.dumps(self.cfg,sort_keys=True,indent=0,
                    separators=(',',':'),ensure_ascii=False)\
                    .replace("\n",'')
        return hashlib.md5(x).hexdigest()

    @property
    def cncs(self):
        return map(lambda c: c.url,self._cncs)
