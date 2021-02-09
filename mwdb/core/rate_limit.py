import time

import redis
from flask import g
from werkzeug.exceptions import TooManyRequests

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
