import datetime
import hashlib

from sqlalchemy.ext.hybrid import hybrid_property

from mwdb.core.karton import send_blob_to_karton

from . import db
from .object import Object


class TextBlob(Object):
    blob_name = db.Column(db.String, index=True)
    blob_size = db.Column(db.Integer, index=True)
    blob_type = db.Column(db.String(32), index=True)
    _content = db.Column("content", db.String())
    last_seen = db.Column(db.DateTime, index=True)

    __mapper_args__ = {
        "polymorphic_identity": "text_blob",
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
        share_3rd_party,
        parent=None,
        attributes=None,
        share_with=None,
        analysis_id=None,
        tags=None,
    ):
        dhash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        blob_obj = TextBlob(
            dhash=dhash,
            blob_name=blob_name,
            blob_size=len(content),
            blob_type=blob_type,
            last_seen=datetime.datetime.utcnow(),
            _content=content.encode("unicode_escape").decode("utf-8"),
            share_3rd_party=share_3rd_party,
        )
        blob_obj, is_new = cls._get_or_create(
            blob_obj,
            share_3rd_party=share_3rd_party,
            parent=parent,
            attributes=attributes,
            share_with=share_with,
            analysis_id=analysis_id,
            tags=tags,
        )
        # If object exists yet: we need to refresh last_seen timestamp
        if not is_new:
            blob_obj.last_seen = datetime.datetime.utcnow()

        return blob_obj, is_new

    def _send_to_karton(self):
        return send_blob_to_karton(self)
