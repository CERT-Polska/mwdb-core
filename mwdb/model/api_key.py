import datetime
import uuid

from itsdangerous import BadSignature, JSONWebSignatureSerializer, SignatureExpired
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm.exc import NoResultFound

from mwdb.core.config import app_config

from . import db


class APIKey(db.Model):
    __tablename__ = "api_key"

    id = db.Column(UUID(as_uuid=True), primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    issued_on = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    issued_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(length=100), nullable=False)

    issuer = db.relationship("User", foreign_keys=[issued_by], uselist=False)

    @property
    def issuer_login(self):
        return self.issuer and self.issuer.login

    @staticmethod
    def verify_token(token):
        s = JSONWebSignatureSerializer(app_config.mwdb.secret_key)
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None
        except BadSignature:
            return None

        if "api_key_id" not in data:
            return None

        try:
            api_key_obj = APIKey.query.filter(
                APIKey.id == uuid.UUID(data["api_key_id"])
            ).one()
        except NoResultFound:
            return None

        return api_key_obj.user

    def generate_token(self):
        s = JSONWebSignatureSerializer(app_config.mwdb.secret_key)
        return s.dumps({"login": self.user.login, "api_key_id": str(self.id)})
