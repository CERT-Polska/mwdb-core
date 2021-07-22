"""
Based on authlib 1.x-dev implementation of OpenIDMixin

https://github.com/lepture/authlib/blob/f17395323555de638eceecf51b535da5b91fcb0a/
authlib/integrations/base_client/sync_openid.py
"""

from authlib.common.security import generate_token
from authlib.integrations.requests_client import OAuth2Session
from authlib.jose import JsonWebKey, JsonWebToken, jwt
from authlib.oidc.core import CodeIDToken, ImplicitIDToken, UserInfo


class OpenIDSession(OAuth2Session):
    def fetch_jwk_set(self, force=True):
        jwk_set = self.metadata.get("jwks")
        if jwk_set and not force:
            return jwk_set

        uri = self.metadata.get("jwks_uri")
        if not uri:
            raise RuntimeError('Missing "jwks_uri" in metadata')

        resp = self.request("GET", uri, withhold_token=True)
        resp.raise_for_status()
        jwk_set = resp.json()

        self.metadata["jwks"] = jwk_set
        return jwk_set

    def userinfo(self, **kwargs):
        """Fetch user info from ``userinfo_endpoint``."""
        resp = self.get(self.metadata["userinfo_endpoint"], **kwargs)
        resp.raise_for_status()
        data = resp.json()
        return UserInfo(data)

    def parse_id_token(self, token, nonce, claims_options=None, leeway=120):
        """Return an instance of UserInfo from token's ``id_token``."""
        if "id_token" not in token:
            return None

        def load_key(header, _):
            alg = header.get("alg")
            if alg in ["HS256", "HS384", "HS512"]:
                # For HS256: client secret is used for id_token signing
                return self.client_secret
            elif alg in ["RS256", "RS384", "RS512"]:
                jwk_set = JsonWebKey.import_key_set(self.fetch_jwk_set())
                try:
                    return jwk_set.find_by_kid(header.get("kid"))
                except ValueError:
                    # re-try with new jwk set
                    jwk_set = JsonWebKey.import_key_set(self.fetch_jwk_set(force=True))
                    return jwk_set.find_by_kid(header.get("kid"))
            else:
                raise RuntimeError(f"Unsupported id_token algorithm: '{alg}'")

        claims_params = dict(nonce=nonce, client_id=self.client_id)
        if "access_token" in token:
            claims_params["access_token"] = token["access_token"]
            claims_cls = CodeIDToken
        else:
            claims_cls = ImplicitIDToken

        if claims_options is None and "issuer" in self.metadata:
            claims_options = {"iss": {"values": [self.metadata["issuer"]]}}

        alg_values = self.metadata.get("id_token_signing_alg_values_supported")
        if alg_values:
            _jwt = JsonWebToken(alg_values)
        else:
            _jwt = jwt

        claims = _jwt.decode(
            token["id_token"],
            key=load_key,
            claims_cls=claims_cls,
            claims_options=claims_options,
            claims_params=claims_params,
        )
        # https://github.com/lepture/authlib/issues/259
        if claims.get("nonce_supported") is False:
            claims.params["nonce"] = None

        claims.validate(leeway=leeway)
        return UserInfo(claims)

    def generate_nonce(self):
        return generate_token()
