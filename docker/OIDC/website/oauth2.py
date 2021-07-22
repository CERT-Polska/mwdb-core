from authlib.integrations.flask_oauth2 import AuthorizationServer, ResourceProtector
from authlib.integrations.sqla_oauth2 import (
    create_bearer_token_validator,
    create_query_client_func,
    create_revocation_endpoint,
    create_save_token_func,
)
from authlib.oauth2.rfc6749 import grants
from authlib.oidc.core import UserInfo
from authlib.oidc.core import grants as oidc_grants
from website import app
from werkzeug.security import gen_salt

from .models import OAuth2AuthorizationCode, OAuth2Client, OAuth2Token, User, db

DUMMY_JWT_CONFIG = {
    "key": "",
    "alg": "HS256",
    "iss": "https://authlib.org",
    "exp": 3600,
}


def exists_nonce(nonce, req):
    exists = OAuth2AuthorizationCode.query.filter_by(
        client_id=req.client_id, nonce=nonce
    ).first()
    return bool(exists)


def generate_user_info(user, scope):
    return UserInfo(sub=str(user.id), name=user.username)


def create_authorization_code(client, grant_user, request):
    code = gen_salt(48)
    nonce = request.data.get("nonce")
    item = OAuth2AuthorizationCode(
        code=code,
        client_id=client.client_id,
        redirect_uri=request.redirect_uri,
        scope=request.scope,
        user_id=grant_user.id,
        nonce=nonce,
    )
    db.session.add(item)
    db.session.commit()
    return code


class AuthorizationCodeGrant(grants.AuthorizationCodeGrant):
    def create_authorization_code(self, client, grant_user, request):
        return create_authorization_code(client, grant_user, request)

    def parse_authorization_code(self, code, client):
        item = OAuth2AuthorizationCode.query.filter_by(
            code=code, client_id=client.client_id
        ).first()
        if item and not item.is_expired():
            return item

    def delete_authorization_code(self, authorization_code):
        db.session.delete(authorization_code)
        db.session.commit()

    def authenticate_user(self, authorization_code):
        return User.query.get(authorization_code.user_id)


class OpenIDCode(oidc_grants.OpenIDCode):
    def exists_nonce(self, nonce, request):
        return exists_nonce(nonce, request)

    def get_jwt_config(self, grant):
        # Sign JWT with client_secret
        return {
            "key": grant.request.client.client_secret,
            "alg": "HS256",
            "iss": "https://authlib.org",
            "exp": 3600,
        }

    def generate_user_info(self, user, scope):
        return generate_user_info(user, scope)


query_client = create_query_client_func(db.session, OAuth2Client)
save_token = create_save_token_func(db.session, OAuth2Token)
authorization = AuthorizationServer(
    query_client=query_client,
    save_token=save_token,
)
require_oauth = ResourceProtector()

authorization.init_app(app)

# support only authorization_code grant
authorization.register_grant(AuthorizationCodeGrant, [OpenIDCode(require_nonce=True)])

# support revocation
revocation_cls = create_revocation_endpoint(db.session, OAuth2Token)
authorization.register_endpoint(revocation_cls)

# protect resource
bearer_cls = create_bearer_token_validator(db.session, OAuth2Token)
require_oauth.register_token_validator(bearer_cls())
