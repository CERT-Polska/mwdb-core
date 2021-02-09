from flask import g
from flask_restful import Resource

from mwdb.core.app import api
from mwdb.core.config import app_config
from mwdb.core.plugins import get_plugin_info
from mwdb.schema.server import ServerInfoResponseSchema, ServerPingResponseSchema
from mwdb.version import app_build_version


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
                "recaptcha_site_key": app_config.mwdb.recaptcha_site_key,
                "base_url": app_config.mwdb.base_url,
                "active_plugins": get_plugin_info(),
                "remotes": app_config.mwdb.remotes,
            }
        )


class ServerDocsResource(Resource):
    def get(self):
        """
        ---
        summary: Get server API documentation
        description: Returns API documentation in OAS3 format
        tags:
            - server
        responses:
            200:
              description: OAS3 server API documentation
        """
        return api.spec.to_dict()
