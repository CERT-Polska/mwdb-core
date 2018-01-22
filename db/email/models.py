
import hashlib,json
from datetime import datetime
from db.base import Base,Tag
from db.decorators import viewable

from db.network.models import URL,IP
from sqlalchemy import UniqueConstraint

from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey, Table, Column 
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy import Integer,UnicodeText,Unicode, DateTime,String
from sqlalchemy_utils.types import TSVectorType



email_tag = Table('email_tag', Base.metadata,
                Column('e', Integer, ForeignKey('emails.id')),
                Column('t', Integer, ForeignKey('tags.id'))
)

email_att = Table('email_att', Base.metadata,
                Column('e', Integer, ForeignKey('emails.id')),
                Column('a', Integer, ForeignKey('attachments.id'))
)


email_url = Table('email_url', Base.metadata,
                Column('e', Integer, ForeignKey('emails.id')),
                Column('u', Integer, ForeignKey('urls.id'))
)

email_ip = Table('email_ip', Base.metadata,
                Column('e', Integer, ForeignKey('emails.id')),
                Column('i', Integer, ForeignKey('ips.ip'))
)

att_names = Table('att_names', Base.metadata,
                Column('n', Integer, ForeignKey('names.id')),
                Column('a', Integer, ForeignKey('attachments.id'))
)


class Attachment(Base):
    
    __table_args__ = (UniqueConstraint('obj_id','content_hash'),)
    
    id     = Column(Integer,primary_key=True)
    obj_id = Column(Integer,ForeignKey('objects.id'),nullable=True)
    content = Column(UnicodeText)
    content_hash = Column(String(64),nullable=False)
    content_type = Column(String(128),nullable=False)
    search_vector = Column(TSVectorType('content'))

    _names  = relationship('Name',
                       secondary=att_names,
                       backref="attachments")
@viewable('subject')    
class Email(Base):

    id   = Column(Integer,primary_key=True)
    comment = Column(UnicodeText(), nullable=True)
    timestamp = Column(DateTime(timezone=False),
                        default=datetime.utcnow, nullable=False)
    ehash     = Column(String(64),unique=True)
    subject   = Column(UnicodeText)
    _from      = Column('from',Unicode(255))

    headers   = Column(JSONB,nullable=False)
    search_vector = Column(TSVectorType('from', 'subject'))

    
    _urls = relationship(URL,
                secondary=email_url,
                backref='emails')
    
    ips = relationship(IP,
                secondary=email_ip,
                backref='emails')

    attachments = relationship(Attachment,
                    secondary=email_att,
                    backref='emails')

    _tags   = relationship('Tag',
                    secondary=email_tag,
                    backref="emails")
    
    def __init__(self,_from,subject,fh,hdr):
        self._from = _from
        self.subject = subject
        self.ehash  = fh
        self.headers = hdr

    @property
    def urls(self):
        return map(lambda c: c.url,self._url)
