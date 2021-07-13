from . import db


class Oauth(db.Model):
    __tablename__ = "oauth"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(64), nullable=False)
    client_id = db.Column(db.String(64), nullable=False)
    client_secret = db.Column(db.String(64), nullable=False)
    api_base_url = db.Column(db.String(128), nullable=False)
    access_token_url = db.Column(db.String(128), nullable=False)
    authorize_url = db.Column(db.String(128), nullable=False)
    server_metadata_url = db.Column(db.String(128), nullable=True)
    userinfo_endpoint = db.Column(db.String(128), nullable=False)

    _authorize_params = db.Column(db.String(128), nullable=True)
    _access_token_params = db.Column(db.String(128), nullable=True)
    _client_kwargs = db.Column(db.String(64), nullable=False)

    @property
    def client_kwargs(self):
        return {"scope": self._scope}

    @property
    def authorize_params(self):
        return {"params": self._authorize_params}

    @property
    def access_token_params(self):
        return {"params": self._access_token_params}
