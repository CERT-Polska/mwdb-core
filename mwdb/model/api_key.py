import datetime
import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm.exc import NoResultFound

from mwdb.core.auth import AuthScope, generate_token, verify_legacy_token, verify_token

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
        data = verify_token(token, scope=AuthScope.api_key)

        if data is None:
            # check for legacy API Token
            data = verify_legacy_token(token, required_fields={"login", "api_key_id"})
            if data is None:
                return None

        try:
            api_key_obj = APIKey.query.filter(
                APIKey.id == uuid.UUID(data["api_key_id"])
            ).one()
        except NoResultFound:
            return None

        return api_key_obj.user

    def generate_token(self):
        return generate_token(
            {"login": self.user.login, "api_key_id": str(self.id)},
            scope=AuthScope.api_key,
        )
