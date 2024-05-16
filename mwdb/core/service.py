import re
import sys
import textwrap

from apispec import APISpec, yaml_utils
from apispec.ext.marshmallow import MarshmallowPlugin
from flask import Blueprint, Flask, jsonify, request
from flask.typing import ResponseReturnValue
from flask.views import MethodView
from sqlalchemy.exc import OperationalError
from werkzeug.exceptions import (
    HTTPException,
    InternalServerError,
    MethodNotAllowed,
    ServiceUnavailable,
)

from mwdb.version import app_version

from .log import getLogger

logger = getLogger()


def flaskpath2openapi(path: str) -> str:
    """Convert a Flask URL rule to an OpenAPI-compliant path.

    Got from https://github.com/marshmallow-code/apispec-webframeworks/

    :param str path: Flask path template.
    """
    # from flask-restplus
    re_url = re.compile(r"<(?:[^:<>]+:)?([^<>]+)>")
    return re_url.sub(r"{\1}", path)


class Resource(MethodView):
    init_every_request = False

    def dispatch_request(self, *args, **kwargs):
        method = request.method.lower()
        if not hasattr(self, method):
            raise MethodNotAllowed(
                valid_methods=self.methods,
                description="Method is not allowed for this endpoint",
            )
        response = getattr(self, method)(*args, **kwargs)
        if response is None:
            return jsonify(None), 200
        return response


class Service:
    description = textwrap.dedent(
        """
        MWDB API documentation.

        If you want to automate things, we recommend using
        <a href="https://github.com/CERT-Polska/mwdblib">
            mwdblib library
        </a>
    """
    )
    servers = [
        {
            "url": "{scheme}://{host}",
            "description": "MWDB API endpoint",
            "variables": {
                "scheme": {"enum": ["http", "https"], "default": "https"},
                "host": {"default": "mwdb.cert.pl"},
            },
        }
    ]

    def __init__(self, app: Flask) -> None:
        self.app = app
        self.blueprint = Blueprint("api", __name__, url_prefix="/api")
        self.spec = APISpec(
            title="MWDB Core",
            version=app_version,
            openapi_version="3.0.2",
            plugins=[MarshmallowPlugin()],
            info={"description": self.description},
            servers=self.servers,
        )
        self.spec.components.security_scheme(
            "bearerAuth", {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
        )

    def _make_error_response(self, exc: HTTPException) -> ResponseReturnValue:
        return jsonify({"message": exc.description}), exc.code

    def error_handler(self, exc: Exception) -> ResponseReturnValue:
        if isinstance(exc, HTTPException):
            return self._make_error_response(exc)
        elif isinstance(exc, OperationalError):
            return self._make_error_response(
                ServiceUnavailable(
                    description="Request canceled due to statement timeout"
                )
            )
        else:
            # Unknown exception, return ISE 500
            logger.exception("Internal server error", exc_info=sys.exc_info())
            return self._make_error_response(
                InternalServerError(description="Internal server error")
            )

    def add_resource(
        self, resource: Resource, *urls: str, undocumented: bool = False
    ) -> None:
        view = resource.as_view(resource.__name__)
        endpoint = view.__name__.lower()
        for url in urls:
            self.blueprint.add_url_rule(rule=url, endpoint=endpoint, view_func=view)
        if not undocumented:
            resource_doc = resource.__doc__ or ""
            operations = yaml_utils.load_operations_from_docstring(resource_doc)
            for method in resource.methods:
                method_name = method.lower()
                method_doc = getattr(resource, method_name).__doc__
                if method_doc:
                    operations[method_name] = yaml_utils.load_yaml_from_docstring(
                        method_doc
                    )
            for url in urls:
                prefixed_url = self.blueprint.url_prefix + "/" + url.lstrip("/")
                self.spec.path(
                    path=flaskpath2openapi(prefixed_url), operations=operations
                )

    def register(self):
        """
        Registers service and its blueprint to the app.

        This must be done after adding all resources.
        """
        # This handler is intentionally set on app and not blueprint
        # to catch routing errors as well. The side effect is that
        # it will return jsonified error messages for static endpoints
        # but static files should be handled by separate server anyway...
        self.app.register_error_handler(Exception, self.error_handler)
        self.app.register_blueprint(self.blueprint)

    def relative_url_for(self, resource, **values):
        # TODO: Remove this along with legacy download endpoint
        endpoint = self.blueprint.name + "." + resource.__name__.lower()
        path = self.app.url_for(endpoint, **values)
        return path[len(self.blueprint.url_prefix) :]
