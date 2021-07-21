from mwdb.core.oidc import OpenIDSession

from . import db


class OpenIDUser(db.Model):
    __tablename__ = "openid_user"

    # todo
    ...


class OpenIDProvider(db.Model):
    __tablename__ = "openid_provider"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(64), nullable=False)
    client_id = db.Column(db.String(64), nullable=False)
    client_secret = db.Column(db.String(64), nullable=False)
    authorization_endpoint = db.Column(db.String(128), nullable=False)
    token_endpoint = db.Column(db.String(128), nullable=False)
    userinfo_endpoint = db.Column(db.String(128), nullable=False)
    jwks_endpoint = db.Column(db.String(128), nullable=True)

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
            nonce,
            *client.create_authorization_url(
                self.authorization_endpoint, redirect_uri=redirect_uri, nonce=nonce
            ),
        )

    def fetch_id_token(self, code, state, nonce):
        client = self._get_client()
        token = client.fetch_token(code=code, state=state)
        return client.parse_id_token(token, nonce)
