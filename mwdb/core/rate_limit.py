import time
from typing import Iterator, List, Optional, Tuple

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


if app_config.mwdb.enable_rate_limit:
    limit_storage = RedisStorage(app_config.mwdb.redis_uri)
    limiter = FixedWindowRateLimiter(limit_storage)
else:
    limiter = None


def get_limit_from_config(key) -> Optional[str]:
    return app_config.get_key("mwdb_limiter", key) or DEFAULT_RATE_LIMITS.get(key)


def get_limit_keys_for_request() -> List[Tuple[str, ...]]:
    """
    Finds suitable limit keys for current request
    """
    # Split blueprint name and resource name from endpoint
    if request.endpoint:
        _, resource_name = request.endpoint.split(".", 2)
    else:
        resource_name = None

    method = request.method.lower()
    user_group_keys = (
        [f"group_{group}" for group in g.auth_user.group_names]
        if g.auth_user is not None
        else ["unauthenticated"]
    )

    # Limit keys from most specific to the least specific
    if resource_name is not None:
        resource_limit_keys = [(resource_name, method), (resource_name,), (method,)]
    else:
        resource_limit_keys = [(method,)]

    return (
        [
            (user_group, *resource_limit_key_items)
            for user_group in user_group_keys
            for resource_limit_key_items in resource_limit_keys
        ]
        + [(user_group,) for user_group in user_group_keys]
        + resource_limit_keys
    )


def get_limits_for_request() -> Iterator[Tuple[Tuple[str, ...], List[str]]]:
    """
    Finds suitable limits for current request
    """
    limit_keys = get_limit_keys_for_request()
    for limit_key in limit_keys:
        # Get limit values for key
        limit_values = get_limit_from_config("_".join(limit_key))
        if not limit_values:
            continue
        yield limit_key, limit_values.split(" ")


def apply_rate_limit_for_request() -> bool:
    """
    Raises TooManyRequests if current user has exceeded the rate limit
    for current request. Limits are hierarchical and the lookup is as follows:
    - count a hit for resource and method (if limit is set)
    - count a hit for resource (if limit is set)
    - count a hit for method (if limit is not set then default is used)

    Limits are login-based for authenticated users.
    If user is not authenticated then limit is IP-based.
    """
    # If limiter is not available: rate limiting is turned off
    if not limiter:
        return False
    # If rate limiting is disabled for current user: turned off
    if g.auth_user is not None and g.auth_user.has_rights(
        Capabilities.unlimited_requests
    ):
        return False
    limits = get_limits_for_request()
    user = g.auth_user.login if g.auth_user is not None else request.remote_addr
    for limit_key, limit_values in limits:
        for limit_value in limit_values:
            limit_item = parse(limit_value)
            identifiers = (user, *limit_key)
            if not limiter.hit(limit_item, *identifiers):
                reset_time = limiter.get_window_stats(
                    limit_item, *identifiers
                ).reset_time
                # Limits' reset_time uses Redis TTL internally and
                # adds time.time to it, so we can safely subtract
                # the same value. There still should be a cutoff to
                # make clients wait at least few seconds.
                retry_after = max(5, reset_time - int(time.time()))
                raise TooManyRequests(
                    retry_after=retry_after,
                    description=f"Request limit: {limit_value} for "
                    f"{'_'.join(limit_key)} was exceeded!",
                )
