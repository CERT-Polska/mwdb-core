"""
Based on authlib 1.x-dev implementation of OpenIDMixin

https://github.com/lepture/authlib/blob/f17395323555de638eceecf51b535da5b91fcb0a/
authlib/integrations/base_client/sync_openid.py
"""

from authlib.common.security import generate_token
from authlib.integrations.requests_client import OAuth2Session
from authlib.jose import JsonWebKey, JsonWebToken
from authlib.oidc.core import CodeIDToken, ImplicitIDToken, UserInfo


class OpenIDClient:
    """
    Stateful client representing OpenID Connect session using
    specified client and provider data
    """

    supported_algorithms = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512"]

    def __init__(
        self,
        client_id,
        client_secret,
        authorization_endpoint,
        token_endpoint,
        userinfo_endpoint,
        jwks_uri,
        **kwargs,
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.authorization_endpoint = authorization_endpoint
        self.token_endpoint = token_endpoint
        self.userinfo_endpoint = userinfo_endpoint
        self.jwks_uri = jwks_uri

        self.session = OAuth2Session(
            client_id=client_id,
            client_secret=client_secret,
            authorization_endpoint=authorization_endpoint,
            token_endpoint=token_endpoint,
            userinfo_endpoint=userinfo_endpoint,
            jwks_uri=jwks_uri,
            **kwargs,
        )

    def create_authorization_url(self, redirect_uri):
        nonce = generate_token()
        return (
            *self.session.create_authorization_url(
                self.authorization_endpoint, nonce=nonce, redirect_uri=redirect_uri
            ),
            nonce,
        )

    def load_key(self, header, _):
        alg = header.get("alg")
        if alg in ["HS256", "HS384", "HS512"]:
            # For HS256: client secret is used for id_token signing
            return self.client_secret
        elif alg in ["RS256", "RS384", "RS512"]:
            jwk_set = JsonWebKey.import_key_set(self.fetch_jwk_set())
            return jwk_set.find_by_kid(header.get("kid"))
        else:
            raise RuntimeError(f"Unsupported id_token algorithm: '{alg}'")

    def fetch_jwk_set(self):
        if not self.jwks_uri:
            raise RuntimeError('Missing "jwks_uri" in metadata')

        resp = self.session.request("GET", self.jwks_uri, withhold_token=True)
        resp.raise_for_status()
        jwk_set = resp.json()
        return jwk_set

    def fetch_id_token(self, code, state, nonce, redirect_uri):
        token = self.session.fetch_token(
            code=code, state=state, redirect_uri=redirect_uri
        )
        return self.parse_id_token(token, nonce)

    def parse_id_token(self, token, nonce, claims_options=None, leeway=120):
        """Return an instance of UserInfo from token's ``id_token``."""
        if "id_token" not in token:
            return None

        claims_params = dict(nonce=nonce, client_id=self.client_id)
        if "access_token" in token:
            claims_params["access_token"] = token["access_token"]
            claims_cls = CodeIDToken
        else:
            claims_cls = ImplicitIDToken

        jwt = JsonWebToken(self.supported_algorithms)
        claims = jwt.decode(
            token["id_token"],
            key=self.load_key,
            claims_cls=claims_cls,
            claims_options=claims_options,
            claims_params=claims_params,
        )
        # https://github.com/lepture/authlib/issues/259
        if claims.get("nonce_supported") is False:
            claims.params["nonce"] = None

        claims.validate(leeway=leeway)
        return UserInfo(claims)

    def userinfo(self, **kwargs):
        """Fetch user info from ``userinfo_endpoint``."""
        resp = self.session.get(self.userinfo_endpoint, **kwargs)
        resp.raise_for_status()
        data = resp.json()
        return UserInfo(data)
