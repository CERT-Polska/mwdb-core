import sys
import textwrap

from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from apispec_webframeworks.flask import FlaskPlugin
from flask import Blueprint, Flask, jsonify, request
from flask.typing import ResponseReturnValue
from sqlalchemy.exc import OperationalError
from werkzeug.exceptions import (
    HTTPException,
    InternalServerError,
    MethodNotAllowed,
    ServiceUnavailable,
)
from werkzeug.wrappers import Response

from mwdb.version import app_version

from .log import getLogger

SUPPORTED_METHODS = ["head", "get", "post", "put", "delete", "patch"]

logger = getLogger()


class Resource:
    def __init__(self):
        self.available_methods = [
            method.upper() for method in SUPPORTED_METHODS if hasattr(self, method)
        ]

    def __call__(self, *args, **kwargs):
        """
        Acts as view function, calling appropriate method and
        jsonifying response
        """
        if request.method not in self.available_methods:
            raise MethodNotAllowed(
                valid_methods=self.available_methods,
                description="Method is not allowed for this endpoint",
            )
        method = request.method.lower()
        response = getattr(self, method)(*args, **kwargs)
        if isinstance(response, Response):
            return response
        return jsonify(response)

    def get_methods(self):
        """
        Returns available methods for this resource
        """
        return [getattr(self, method) for method in self.available_methods]


class Service:
    def __init__(self, app: Flask, blueprint: Blueprint) -> None:
        self.app = app
        self.blueprint = blueprint
        self.blueprint.register_error_handler(Exception, self.error_handler)
        self.spec = APISpec(
            title="MWDB Core",
            version=app_version,
            openapi_version="3.0.2",
            plugins=[FlaskPlugin(), MarshmallowPlugin()],
            info={
                "description": textwrap.dedent(
                    """
                    MWDB API documentation.

                    If you want to automate things, we recommend using
                    <a href="http://github.com/CERT-Polska/mwdblib">
                        mwdblib library
                    </a>
                    """
                )
            },
            servers=[
                {
                    "url": "{scheme}://{host}",
                    "description": "MWDB API endpoint",
                    "variables": {
                        "scheme": {"enum": ["http", "https"], "default": "https"},
                        "host": {"default": "mwdb.cert.pl"},
                    },
                }
            ],
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
                ServiceUnavailable("Request canceled due to statement timeout")
            )
        else:
            # Unknown exception, return ISE 500
            logger.exception("Internal server error", exc_info=sys.exc_info())
            return self._make_error_response(
                InternalServerError("Internal server error")
            )

    def add_resource(
        self, resource: Resource, *urls: str, undocumented: bool = False
    ) -> None:
        for url in urls:
            endpoint = f"{self.blueprint.name}.{resource.__name__.lower()}"
            self.blueprint.add_url_rule(rule=url, endpoint=endpoint, view_func=resource)
        if not undocumented:
            self.spec.path(view=resource, app=self.app)
