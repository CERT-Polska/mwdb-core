"""
Utilities for marking deprecated features to monitor usage
"""
from enum import Enum
from functools import wraps
from typing import Optional

from flask import g, request

from mwdb.core.log import getLogger
from mwdb.core.metrics import metric_deprecated_usage

logger = getLogger()


class DeprecatedFeature(Enum):
    # API keys non-complaint with RFC7519
    # Deprecated in v2.7.0
    legacy_api_key_v2 = "legacy_api_key_v2"
    # Legacy /request/sample/<token>
    # Use /file/<id>/download instead
    # Deprecated in v2.2.0
    legacy_file_download = "legacy_file_download"
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
