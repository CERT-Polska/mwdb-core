from urlparse import urlparse
from datetime import datetime
from db.base import Base,Tag
from db.decorators import viewable

from sqlalchemy.orm import relationship, backref
from sqlalchemy import ForeignKey, Table, Column
from sqlalchemy import Integer, String, Boolean, DateTime, Enum, Text

import socket




ip_tag = Table('ip_tag', Base.metadata,
                Column('t',Integer,ForeignKey('tags.id')),
                Column('i',Integer,ForeignKey('ips.ip')),
                extend_existing=True
)

dom_tag = Table('dom_tag', Base.metadata,
                Column('t',Integer,ForeignKey('tags.id')),
                Column('d',Integer,ForeignKey('domains.id')),
                extend_existing=True
)

url_tag = Table('url_tag', Base.metadata,
                Column('t',Integer,ForeignKey('tags.id')),
                Column('u',Integer,ForeignKey('urls.id')),
                extend_existing=True
)


@viewable('ip')
class IP(Base):

    _ip= Column('ip',Integer(),primary_key=True)
    comment = Column(Text(), nullable=True)
    timestamp = Column(DateTime(timezone=False),
                        default=datetime.utcnow, nullable=False)
    
    _tags   = relationship(Tag,
                secondary=ip_tag,
                backref="ips")

    def __init__(self,ip):
        if issubclass(type(ip),basestring):
            ip = IP.to_int(ip)
        self._ip = ip
        
    @property
    def ip(self):
        return IP.to_string(self._ip)

    @staticmethod
    def to_int(ip):
        return int(socket.inet_aton(ip).encode('hex'),16)
    
    @staticmethod
    def to_string(ip):
        return socket.inet_ntoa(hex(ip)[2:].decode('hex'))

        
resolv_table = Table('resolv_table', Base.metadata,
                    Column('d',Integer,ForeignKey('domains.id')),
                    Column('i',Integer,ForeignKey('ips.ip')),
                    Column('begin',DateTime(timezone=False),
                        default=datetime.utcnow, nullable=False),
                    Column('end',DateTime(timezone=False),
                        default=datetime.utcnow, nullable=False),
                    extend_existing=True
                    )

@viewable('domain')
class Domain(Base):
    
    id = Column(Integer(),primary_key=True)
    domain = Column(Text(),index=True,unique=True)
    comment = Column(Text(), nullable=True)
    timestamp = Column(DateTime(timezone=False),
                        default=datetime.utcnow, nullable=False)
    
    ips    = relationship(IP,
                secondary=resolv_table,
                backref="domains")
    _tags  = relationship(Tag,
                secondary=dom_tag,
                backref="domains")

    def __init__(self,domain):
        self.domain = domain

class URLCuckoo(Base):
    __tablename__ = 'url_cuckoo'

    id  = Column('cuckoo_id', Integer)
    uid = Column('uid', Integer, ForeignKey('urls.id'))
    __mapper_args__ = {"primary_key": (id, uid)}

    def __init__(self, id):
        self.id = id


@viewable('url')
class URL(Base):
    __tablename__  = 'urls'

    id = Column(Integer(),primary_key=True)
    path  = Column(Text(),nullable=True)
    hostname = Column(Integer, ForeignKey('domains.id'))
    scheme   = Column(String(16),default='http')
    port     = Column(Integer,default=80)
    fragment = Column(Text,nullable=True)
    params   = Column(Text,nullable=True)
    comment  = Column(Text, nullable=True)
    url      = Column(String(1024),unique=True)
    timestamp = Column(DateTime(timezone=False),
                        default=datetime.utcnow, nullable=False)
    
    _tags    = relationship(Tag,
                secondary=url_tag,
                backref="urls")

    _cuckoo = relationship(URLCuckoo)

    def __init__(self,url):
        self.url = url
        self.purl = urlparse(url)
        self._hostname = self.purl.hostname
        for atr in ('port','scheme','fragment','params','path'):
            if hasattr(self.purl,atr):
                setattr(self,atr,getattr(self.purl,atr))
            
        if not self.port and self.scheme == 'https':
            self.port = 443
