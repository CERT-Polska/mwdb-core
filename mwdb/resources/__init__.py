from functools import wraps

from flask import g, request
from werkzeug.exceptions import Forbidden, Unauthorized

from mwdb.core import log
from mwdb.model import Object, File, Config, TextBlob

logger = log.getLogger()


def requires_capabilities(*required_caps):
    """
    Decorator for endpoints which require specific permission.
    Available capabilities are declared in capabilities.Capabilities
    """

    def decorator(f):
        @wraps(f)
        def endpoint(*args, **kwargs):
            for required_cap in required_caps:
                if not g.auth_user.has_rights(required_cap):
                    raise Forbidden("You are not permitted to perform this action")
            return f(*args, **kwargs)

        return endpoint

    return decorator


def requires_authorization(f):
    """
    Decorator for endpoints which require authorization.
    """
    @wraps(f)
    def endpoint(*args, **kwargs):
        if not g.auth_user:
            raise Unauthorized('Not authenticated.')
        return f(*args, **kwargs)
    return endpoint


def deprecated(f):
    """
    Decorator for deprecated methods
    """
    @wraps(f)
    def endpoint(*args, **kwargs):
        logger.warning("Used deprecated endpoint: %s", request.path)
        return f(*args, **kwargs)
    return endpoint


def get_type_from_str(s):
    object_types = {
        "object": Object,
        "file": File,
        "config": Config,
        "blob": TextBlob
    }
    if s not in object_types:
        # Should never happen, routes should be restricted on route definition level
        raise ValueError(f"Incorrect object type '{s}'")
    return object_types[s]


def access_object(object_type, identifier):
    """
    Get object by provided string type and identifier
    :param object_type: String type [file, config, blob, object]
    :param identifier: Object identifier
    :return: Returns specified object or None when object doesn't exist, has different type or user doesn't have
             access to this object.
    """
    return get_type_from_str(object_type).access(identifier)
