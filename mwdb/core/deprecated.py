"""
Utilities for marking deprecated features to monitor usage
"""

from enum import Enum
from functools import wraps
from typing import Optional

from flask import g, request
from werkzeug.exceptions import BadRequest

from mwdb.core.config import app_config
from mwdb.core.log import getLogger
from mwdb.core.metrics import metric_deprecated_usage

logger = getLogger()


class DeprecatedFeature(Enum):
    # Unmanageable API keys, deprecated in v2.0.0
    legacy_api_key_v1 = "legacy_api_key_v1"
    # API keys non-complaint with RFC7519
    # Deprecated in v2.7.0
    legacy_api_key_v2 = "legacy_api_key_v2"
    # Legacy PUT/POST /api/<object_type>/<parent>
    # Use POST /api/<object_type> instead
    # Deprecated in v2.0.0
    legacy_object_upload = "legacy_file_upload"
    # Legacy /request/sample/<token>
    # Use /file/<id>/download instead
    # Deprecated in v2.2.0
    legacy_file_download = "legacy_file_download"
    # Legacy /search
    # Use GET /<object_type> instead
    # Deprecated in v2.0.0
    legacy_search = "legacy_search"
    # Legacy ?page parameter in object listing endpoints
    # Use "?older_than" instead
    # Deprecated in v2.0.0
    legacy_page_parameter = "legacy_page_parameter"
    # Legacy Metakey API
    # Use Attribute API instead
    # Deprecated in v2.6.0
    legacy_metakey_api = "legacy_metakey_api"
    # Legacy Metakey API
    # Use Attribute API instead
    # Deprecated in v2.6.0
    legacy_metakeys_upload_option = "legacy_metakeys_upload_option"


def uses_deprecated_api(
    feature: DeprecatedFeature,
    endpoint: Optional[str] = None,
    method: Optional[str] = None,
    user: Optional[str] = None,
):
    if user is None:
        user = g.auth_user.login if g.auth_user is not None else None
    metric_deprecated_usage.inc(
        feature=str(feature.value), endpoint=endpoint, method=method, user=user
    )
    logger.debug(
        f"Used deprecated feature: {feature}"
        + (f" ({method} {endpoint})" if endpoint is not None else "")
    )
    if app_config.mwdb.enable_brownout:
        if feature == DeprecatedFeature.legacy_api_key_v2:
            # This feature won't be removed in v3
            return
        raise BadRequest(
            f"Brownout: {feature} API feature is deprecated and currently disabled. "
            f"Please upgrade your MWDB API client."
        )


def deprecated_endpoint(feature: DeprecatedFeature):
    def method_wrapper(f):
        @wraps(f)
        def endpoint(*args, **kwargs):
            uses_deprecated_api(
                feature, endpoint=request.endpoint, method=request.method
            )
            return f(*args, **kwargs)

        return endpoint

    return method_wrapper
