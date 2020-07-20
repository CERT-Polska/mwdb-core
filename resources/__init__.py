from functools import wraps
from core import log

from flask import g, request
from werkzeug.exceptions import NotFound, Forbidden, Unauthorized

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


def authenticated_access(object_type, identifier):
    """
    Safe getter for objects with authenticated user rights
    :param object_type: Object type to get (Object for generics,
                                            File/StaticConfig/DynamicConfig for specialized operations)
    :param identifier: Object identifier
    :return: Returns specified object or throws 404 when object doesn't exist or shouldn't exist in current user view
    """
    object = object_type.access(identifier, g.auth_user)
    if not object:
        raise NotFound("Object not found")

    return object
