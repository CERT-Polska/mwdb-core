from functools import wraps
from json import JSONDecodeError

from flask import g, request
from marshmallow import EXCLUDE, ValidationError
from werkzeug.exceptions import BadRequest, Forbidden, NotFound, Unauthorized

from mwdb.core import log
from mwdb.core.capabilities import Capabilities
from mwdb.model import Config, File, Group, Object, TextBlob

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
                    raise Forbidden(
                        f"You don't have required capability "
                        f"({required_cap}) to perform this action"
                    )
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
            raise Unauthorized("Not authenticated.")
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
    object_types = {"object": Object, "file": File, "config": Config, "blob": TextBlob}
    if s not in object_types:
        # Should never happen, routes should be restricted on route definition level
        raise ValueError(f"Incorrect object type '{s}'")
    return object_types[s]


def access_object(object_type, identifier):
    """
    Get object by provided string type and identifier
    :param object_type: String type [file, config, blob, object]
    :param identifier: Object identifier
    :return: Returns specified object or None when object doesn't exist,
             has different type or user doesn't have access to this object.
    """
    return get_type_from_str(object_type).access(identifier)


def loads_schema(request_data, schema):
    try:
        obj = schema.loads(request_data, unknown=EXCLUDE)
    except ValidationError as val_err:
        raise BadRequest(f"ValidationError: {val_err}")
    except JSONDecodeError as json_decode_err:
        raise BadRequest(f"JSONDecodeError: {json_decode_err}")

    return obj


def load_schema(request_data, schema):
    try:
        obj = schema.load(request_data, unknown=EXCLUDE)
    except ValidationError as val_err:
        raise BadRequest(f"ValidationError: {val_err}")
    except JSONDecodeError as json_decode_err:
        raise BadRequest(f"JSONDecodeError: {json_decode_err}")

    return obj


def get_shares_for_upload(upload_as):
    """
    Translates 'upload_as' value from API into list of groups that
    object will be shared with
    """
    if upload_as == "*":
        # If '*' is provided: share with all user's groups except 'public'
        share_with = [group for group in g.auth_user.groups if group.workspace]
    elif upload_as == "private":
        share_with = [Group.get_by_name(g.auth_user.login)]
    else:
        share_group = Group.get_by_name(upload_as)
        # Does group exist?
        if share_group is None:
            raise NotFound(f"Group {upload_as} doesn't exist")
        # Has user access to group?
        if share_group not in g.auth_user.groups and not g.auth_user.has_rights(
            Capabilities.sharing_objects
        ):
            raise NotFound(f"Group {upload_as} doesn't exist")
        # Is group pending?
        if share_group.pending_group is True:
            raise NotFound(f"Group {upload_as} is pending")
        share_with = [share_group, Group.get_by_name(g.auth_user.login)]

    return share_with
