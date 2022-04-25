from flask import g, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config


def is_rate_limit_disabled():
    if not app_config.mwdb.enable_rate_limit:
        return True
    elif g.auth_user is not None and g.auth_user.has_rights(
        Capabilities.unlimited_requests
    ):
        return True
    return False


limiter = Limiter(
    key_func=lambda: (
        f"{g.auth_user.login}-{request.method}"
        if g.auth_user
        else f"{get_remote_address()}-{request.method}"
    ),
    storage_uri=app_config.mwdb.redis_uri,
    headers_enabled=True,
)


def rate_limited_resource(resource_class):
    # default rate limit values
    rate_limits = {
        "get": "1000/10second 2000/minute 6000/5minute 10000/15minute",
        "post": "100/10second 1000/minute 3000/5minute 6000/15minute",
        "put": "100/10second 1000/minute 3000/5minute 6000/15minute",
        "delete": "100/10second 1000/minute 3000/5minute 6000/15minute",
    }
    limit_decorators = []
    http_methods_in_resource = [func.lower() for func in resource_class.methods]

    for method in http_methods_in_resource:
        field = resource_class.__qualname__.split("Resource")[0].lower() + "_" + method
        limits = app_config.get_key("mwdb_limiter", field)

        if not limits:
            limits = rate_limits[method]

        for limit in limits.split():
            limit_decorators.append(
                limiter.limit(
                    limit,
                    methods=[method],
                    error_message=(
                        f"Request limit: {limit} for {method} method was exceeded!"
                    ),
                    exempt_when=is_rate_limit_disabled,
                )
            )
    resource_class.decorators = limit_decorators

    return resource_class
