from flask import g
from flask_restful import Resource

from version import app_build_version
from plugin_engine import active_plugins

from core.config import app_config
from schema.server import (
    ServerPingResponseSchema,
    ServerInfoResponseSchema
)


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
        return schema.dump({
            "server_version": app_build_version,
            "is_authenticated": bool(g.auth_user),
            "is_maintenance_set": app_config.malwarecage.enable_maintenance,
            "is_registration_enabled": app_config.malwarecage.enable_registration,
            "recaptcha_site_key": app_config.malwarecage.recaptcha_site_key,
            "base_url": app_config.malwarecage.base_url,
            "active_plugins": active_plugins
        })
