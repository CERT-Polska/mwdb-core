from flask import g
from flask_restful import Resource

from mwdb.core.app import api
from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.core.plugins import get_plugin_info
from mwdb.schema.server import (
    ServerAdminInfoResponseSchema,
    ServerInfoResponseSchema,
    ServerPingResponseSchema,
)
from mwdb.version import app_build_version

from . import requires_authorization, requires_capabilities


class PingResource(Resource):
    def get(self):
        """
        ---
        summary: Ping server
        description: Returns `ok` if the service is working.
        tags:
            - server
        responses:
            200:
              description: Successful ping response
              content:
                application/json:
                  schema: ServerPingResponseSchema
                  example:
                    status: ok
        """
        schema = ServerPingResponseSchema()
        return schema.dump({"status": "ok"})


class ServerInfoResource(Resource):
    def get(self):
        """
        ---
        summary: Get server information
        description: Returns server information with public configuration
        tags:
            - server
        responses:
            200:
              description: Server info with public configuration
              content:
                application/json:
                  schema: ServerInfoResponseSchema
        """
        schema = ServerInfoResponseSchema()
        return schema.dump(
            {
                "server_version": app_build_version,
                "is_authenticated": bool(g.auth_user),
                "is_maintenance_set": app_config.mwdb.enable_maintenance,
                "is_registration_enabled": app_config.mwdb.enable_registration,
                "is_karton_enabled": app_config.mwdb.enable_karton,
                "recaptcha_site_key": app_config.mwdb.recaptcha_site_key,
            }
        )


class ServerAdminInfoResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def get(self):
        """
        ---
        summary: Get extended server information
        description: |
            Returns information about extra flags and installed plugins

            Requires any administration capability (manage_users)
        security:
            - bearerAuth: []
        tags:
            - server
        responses:
            200:
              description: Server extended information
              content:
                application/json:
                  schema: ServerAdminInfoResponseSchema
            403:
              description: When user doesn't have any of required capabilities
        """

        schema = ServerAdminInfoResponseSchema()
        return schema.dump(
            {
                "rate_limit_enabled": app_config.mwdb.enable_rate_limit,
                "plugins_enabled": app_config.mwdb.enable_plugins,
                "active_plugins": get_plugin_info(),
            }
        )


class ServerDocsResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: Get server API documentation
        description: Returns API documentation in OAS3 format
        security:
            - bearerAuth: []
        tags:
            - server
        responses:
            200:
              description: OAS3 server API documentation
        """
        return api.spec.to_dict()
