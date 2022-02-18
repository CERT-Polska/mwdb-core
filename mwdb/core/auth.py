import time

import jwt

from mwdb.core.config import app_config


def generate_token(fields, expiration=24 * 3600):
    exp = {"exp": time.time() + expiration}
    if "login" in fields.keys():
        sub = {"sub": fields["login"]}
        payload = {**fields, **sub, **exp}
    else:
        payload = {**fields, **exp}

    token = jwt.encode(payload, app_config.mwdb.secret_key, algorithm="HS512")
    return token


def verify_token(token):
    try:
        data = jwt.decode(token, app_config.mwdb.secret_key, algorithms=["HS512"])
    except jwt.ExpiredSignatureError:
        return None
    return data
