import datetime
import hashlib

from sqlalchemy.ext.hybrid import hybrid_property

from mwdb.core.karton import send_blob_to_karton

from . import db
from .object import Object


class TextBlob(Object):
    __tablename__ = "text_blob"

    id = db.Column(db.Integer, db.ForeignKey("object.id"), primary_key=True)
    blob_name = db.Column(db.String, nullable=False, index=True)
    blob_size = db.Column(db.Integer, nullable=False, index=True)
    blob_type = db.Column(db.String(32), nullable=False, index=True)
    _content = db.Column("content", db.String(), nullable=False)
    last_seen = db.Column(db.DateTime, nullable=False, index=True)

    __mapper_args__ = {
        "polymorphic_identity": __tablename__,
    }

    @hybrid_property
    def content(self):
        return bytes(self._content, "utf-8").decode("unicode_escape")

    @classmethod
    def get_or_create(
        cls,
        content,
        blob_name,
        blob_type,
        parent=None,
        metakeys=None,
        share_with=None,
        analysis_id=None,
    ):
        dhash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        blob_obj = TextBlob(
            dhash=dhash,
            blob_name=blob_name,
            blob_size=len(content),
            blob_type=blob_type,
            last_seen=datetime.datetime.utcnow(),
            _content=content.encode("unicode_escape").decode("utf-8"),
        )
        blob_obj, is_new = cls._get_or_create(
            blob_obj,
            parent=parent,
            metakeys=metakeys,
            share_with=share_with,
            analysis_id=analysis_id,
        )
        # If object exists yet: we need to refresh last_seen timestamp
        if not is_new:
            blob_obj.last_seen = datetime.datetime.utcnow()

        return blob_obj, is_new

    def _send_to_karton(self):
        return send_blob_to_karton(self)
