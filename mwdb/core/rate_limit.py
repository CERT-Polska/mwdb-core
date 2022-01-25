import time

import redis
from flask import g, request
from flask_limiter import Limiter
from werkzeug.exceptions import TooManyRequests

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config


def rate_limit(key, duration, limit):
    class TooManyRequestsWithRetryAfter(TooManyRequests):
        def __init__(self, retry_after):
            self.retry_after = retry_after
            super().__init__(
                f"You are too fast. Wait {retry_after} seconds before next request."
            )

        def get_headers(self, environ=None):
            return [
                *super().get_headers(environ=environ),
                ("Retry-After", self.retry_after),
            ]

    conn = redis.from_url(app_config.mwdb.redis_uri)
    current_time = time.time()
    rate_key = f"{key}-{g.auth_user.login}:{duration}:{current_time // duration}"

    count = conn.incr(rate_key)
    conn.expire(rate_key, duration)

    if count > limit:
        raise TooManyRequestsWithRetryAfter(duration - int(current_time % duration))


def rate_limit_enabled():
    if app_config.mwdb.enable_rate_limit and not g.auth_user.has_rights(
        Capabilities.unlimited_requests
    ):
        return True
    else:
        return False


limiter = Limiter(
    key_func=lambda: f"{g.auth_user.login}-{request.method}"
    if rate_limit_enabled()
    else None,
    storage_uri="redis://redis/",
)


def get_limit_decorators(resource):
    # default rate limit values
    decorators_dir = {
        "get": "1000/minute",
        "post": "1000/minute",
        "put": "1000/minute",
        "delete": "1000/minute",
    }
    # rate limit update from config
    for field in app_config.mwdb_limiter.get_registered_properties():
        _resource, method = field.split("_")
        if _resource == resource:
            limits = app_config.get_key("mwdb_limiter", field)
            if limits is not None:
                decorators_dir[method] = limits

    decorators = []

    for key, value in decorators_dir.items():
        for limit in value.split():
            decorators.append(limiter.limit(limit, methods=[key]))

    return decorators
