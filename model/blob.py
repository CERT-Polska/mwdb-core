from sqlalchemy.ext.hybrid import hybrid_property

from . import db
from .object import Object


class TextBlob(Object):
    __tablename__ = 'text_blob'

    id = db.Column(db.Integer, db.ForeignKey('object.id'), primary_key=True)
    blob_name = db.Column(db.String, nullable=True, index=True)
    blob_size = db.Column(db.Integer, nullable=False, index=True)
    blob_type = db.Column(db.String(32), index=True)
    _content = db.Column("content", db.String(), nullable=False)
    last_seen = db.Column(db.DateTime, nullable=False, index=True)

    __mapper_args__ = {
        'polymorphic_identity': __tablename__,
    }

    @hybrid_property
    def content(self):
        return bytes(self._content, "utf-8").decode("unicode_escape")

    @content.setter
    def content(self, content):
        self._content = content.encode("unicode_escape").decode("utf-8")
