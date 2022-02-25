import datetime
from enum import Enum

import jwt

from mwdb.core.config import app_config


class AuthScope(Enum):
    session = "session"
    api_key = "api_key"
    legacy_api_key = "legacy_api_key"
    set_password = "set_password"
    download_file = "download_file"
    legacy_token = "legacy_token"


def generate_token(fields, scope, expiration=24 * 3600):
    token_claims = {
        **fields,
        "exp": (
            datetime.datetime.now(tz=datetime.timezone.utc)
            + datetime.timedelta(seconds=expiration)
        ),
        "iat": datetime.datetime.now(tz=datetime.timezone.utc),
        "aud": app_config.mwdb.base_url,
        "scope": scope,
    }

    if "login" in fields.keys():
        token_claims["sub"] = fields["login"]
    payload = {**fields, **token_claims}
    token = jwt.encode(payload, app_config.mwdb.secret_key, algorithm="HS512")
    return token


def verify_token(token, scope):
    try:
        ver_aud = scope != "legacy_api_key"
        data = jwt.decode(
            token,
            key=app_config.mwdb.secret_key,
            algorithms=["HS512"],
            audience=app_config.mwdb.base_url,
            options={"verify_aud": ver_aud},
        )
        # check for legacy api key
        if scope != "legacy_api_key":
            if data["scope"] != scope:
                return None

    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidSignatureError:
        return None
    return data
