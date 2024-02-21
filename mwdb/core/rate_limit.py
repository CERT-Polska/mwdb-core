import time
from typing import Optional

from flask import g, request
from limits import parse
from limits.storage import RedisStorage
from limits.strategies import FixedWindowRateLimiter
from werkzeug.exceptions import TooManyRequests

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config

# default rate limit values
DEFAULT_RATE_LIMITS = {
    "get": "1000/10second 2000/minute 6000/5minute 10000/15minute",
    "post": "100/10second 1000/minute 3000/5minute 6000/15minute",
    "put": "100/10second 1000/minute 3000/5minute 6000/15minute",
    "delete": "100/10second 1000/minute 3000/5minute 6000/15minute",
}


def is_rate_limit_disabled():
    return g.auth_user is not None and g.auth_user.has_rights(
        Capabilities.unlimited_requests
    )


if app_config.mwdb.enable_rate_limit:
    limit_storage = RedisStorage(app_config.mwdb.redis_uri)
    limiter = FixedWindowRateLimiter(limit_storage)
else:
    limiter = None


def get_limit_from_config(key) -> Optional[str]:
    return app_config.get_key("mwdb_limiter", key) or DEFAULT_RATE_LIMITS.get(key)


def apply_rate_limit_for_request() -> bool:
    if not limiter:
        return False
    if is_rate_limit_disabled():
        return False
    # Split blueprint name from resource name
    _, resource_name = request.endpoint.split(".", 2)
    method = request.method.lower()
    user = g.auth_user.login if g.auth_user is not None else request.remote_addr
    # Limit keys from most specific to the least specific
    limit_keys = [[resource_name, method], [resource_name], [method]]
    for limit_key in limit_keys:
        # Get limit for key
        limit_values = get_limit_from_config("_".join(limit_key))
        if limit_values:
            for limit_value in limit_values.split(" "):
                limit_item = parse(limit_value)
                identifiers = [user, *limit_key]
                if not limiter.hit(limit_item, *identifiers):
                    reset_time = limiter.get_window_stats(
                        limit_item, *identifiers
                    ).reset_time
                    retry_after = max(5, reset_time - int(time.time()))
                    print(reset_time, time.time(), flush=True)
                    raise TooManyRequests(
                        retry_after=retry_after,
                        description=f"Request limit: {limit_value} for "
                        f"{method} method was exceeded!",
                    )
