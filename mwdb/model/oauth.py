from mwdb.core.oauth import OpenIDSession

from . import db


class OpenIDProvider(db.Model):
    __tablename__ = "openid_provider"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(64), nullable=False, unique=True)
    client_id = db.Column(db.String(64), nullable=False)
    client_secret = db.Column(db.String(64), nullable=True)
    authorization_endpoint = db.Column(db.String(128), nullable=False)
    token_endpoint = db.Column(db.String(128), nullable=False)
    userinfo_endpoint = db.Column(db.String(128), nullable=False)
    jwks_endpoint = db.Column(db.String(128), nullable=True)

    identities = db.relationship(
        "OpenIDUserIdentity",
        back_populates="provider",
        cascade="all, delete-orphan",
    )

    def _get_client(self, state=None):
        return OpenIDSession(
            client_id=self.client_id,
            client_secret=self.client_secret,
            scope="openid profile email",
            grant_type="authorization_code",
            response_type="code",
            authorization_endpoint=self.authorization_endpoint,
            token_endpoint=self.token_endpoint,
            jwks_uri=self.jwks_endpoint,
            state=state,
        )

    def create_authorization_url(self, redirect_uri):
        client = self._get_client()
        nonce = client.generate_nonce()
        return (
            *client.create_authorization_url(
                self.authorization_endpoint, nonce=nonce, redirect_uri=redirect_uri
            ),
            nonce,
        )

    def fetch_id_token(self, code, state, nonce, redirect_uri):
        client = self._get_client()
        token = client.fetch_token(code=code, state=state, redirect_uri=redirect_uri)
        return client.parse_id_token(token, nonce)


class OpenIDUserIdentity(db.Model):
    __tablename__ = "openid_identity"

    sub_id = db.Column(db.String(256), primary_key=True, nullable=False)
    provider_id = db.Column(
        db.Integer,
        db.ForeignKey("openid_provider.id"),
        primary_key=True,
        nullable=False,
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), primary_key=True, nullable=False
    )

    user = db.relationship("User", back_populates="openid_identities")
    provider = db.relationship(
        OpenIDProvider, back_populates="identities", lazy="selectin"
    )
