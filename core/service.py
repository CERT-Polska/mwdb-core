from functools import partial
import textwrap

from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin

from flask_restful import Api
from werkzeug.exceptions import HTTPException

from . import log
from .apispec_utils import ApispecFlaskRestful

from version import app_version


class Service(Api):
    def __init__(self, *args, **kwargs):
        self.spec = self._create_spec()
        super().__init__(*args, **kwargs)

    def _init_app(self, app):
        # I want to log exceptions on my own
        def dont_log(*_, **__):
            pass
        app.log_exception = dont_log
        if isinstance(app.handle_exception, partial) and app.handle_exception.func is self.error_router:
            # Prevent double-initialization
            return
        super()._init_app(app)

    def _create_spec(self):
        spec = APISpec(title='Malwarecage',
                       version=app_version,
                       openapi_version='3.0.2',
                       plugins=[ApispecFlaskRestful(), MarshmallowPlugin()])

        spec.components.security_scheme('bearerAuth', {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT'
        })
        spec.options["info"] = {
            "description": textwrap.dedent("""
                Malwarecage API documentation.

                If you want to automate things, we recommend using 
                <a href="http://github.com/CERT-Polska/mwdblib">mwdblib library</a>""")
        }
        spec.options["servers"] = [
            {
                "url": "{scheme}://{host}/api",
                "description": 'Malwarecage API endpoint',
                "variables": {
                    "scheme": {
                        "enum": ["http", "https"],
                        "default": "https"
                    },
                    "host": {
                        "default": "mwdb.cert.pl"
                    },
                }
            }
        ]
        return spec

    def error_router(self, original_handler, e):
        logger = log.getLogger()
        if isinstance(e, HTTPException):
            logger.error(str(e))
        else:
            logger.exception("Unhandled exception occurred")

        # Handle all exceptions using handle_error, not only for owned routes
        try:
            return self.handle_error(e)
        except Exception:
            logger.exception("Exception from handle_error occurred")
            pass
        # If something went wrong - fallback to original behavior
        return super().error_router(original_handler, e)

    def add_resource(self, resource, *urls, undocumented=False, **kwargs):
        super().add_resource(resource, *urls, **kwargs)
        self.spec.path(resource=resource, api=self)
