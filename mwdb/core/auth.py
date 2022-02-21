import datetime

import jwt

from mwdb.core.config import app_config


def generate_token(fields, scope, expiration=24 * 3600):
    time_claims = {
        "exp": datetime.datetime.now(tz=datetime.timezone.utc)
        + datetime.timedelta(seconds=expiration),
        "iat": datetime.datetime.now(tz=datetime.timezone.utc),
    }
    if "login" in fields.keys():
        payload = {
            **fields,
            **time_claims,
            "aud": app_config.mwdb.base_url,
            "scope": scope,
            "sub": fields["login"],
        }
    else:
        payload = {
            **fields,
            **time_claims,
            "aud": app_config.mwdb.base_url,
            "scope": scope,
        }

    token = jwt.encode(payload, app_config.mwdb.secret_key, algorithm="HS512")
    return token


def verify_token(token, scope):
    try:
        data = jwt.decode(
            token,
            app_config.mwdb.secret_key,
            audience=app_config.mwdb.base_url,
            algorithms=["HS512"],
        )
        if data["scope"] != scope:
            return None
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidSignatureError:
        return None
    return data
