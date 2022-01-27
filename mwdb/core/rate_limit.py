from flask import g, request
from flask_limiter import Limiter

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config


def rate_limit_enabled():
    if (
        app_config.mwdb.enable_rate_limit
        and g.auth_user is not None
        and not g.auth_user.has_rights(Capabilities.unlimited_requests)
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


def get_limit_decorators(resource_class_name):
    # default rate limit values
    rate_limits = {
        "get": "1000/10second 2000/minute 6000/5minute 10000/15minute",
        "post": "100/10second 1000/minute 3000/5minute 6000/15minute",
        "put": "100/10second 1000/minute 3000/5minute 6000/15minute",
        "delete": "100/10second 1000/minute 3000/5minute 6000/15minute",
    }

    resource = resource_class_name.split("Resource")[0].lower()

    # rate limit update from config
    for field in app_config.mwdb_limiter.get_registered_properties():
        _resource, method = field.split("_")
        if _resource == resource:
            limits = app_config.get_key("mwdb_limiter", field)
            if limits is not None:
                rate_limits[method] = limits

    limit_decorators = []

    for key, value in rate_limits.items():
        method = key.upper()
        for limit in value.split():
            limit_decorators.append(
                limiter.limit(
                    limit,
                    methods=[method],
                    error_message=f"Request limit: {limit} "
                    f"for {method} method was exceeded!",
                )
            )

    return limit_decorators
