from flask import g
from flask_restful import Resource
from version import app_build_version
from plugin_engine import active_plugins

from core.config import app_config
from core.schema import PingStatusSchema, ServerInfoSchema


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
                  schema: PingStatusSchema
        """
        schema = PingStatusSchema()
        return schema.dump({"status": "ok"})


class ServerInfoResource(Resource):
    def get(self):
        """
        ---
        summary: Get server information
        description: Returns server information with frontend configuration
        tags:
            - server
        responses:
            200:
              description: server info with frontend configuration
              content:
                application/json:
                  schema: ServerInfoSchema
        """
        schema = ServerInfoSchema()
        return schema.dump({
            "server_version": app_build_version,
            "is_authenticated": bool(g.auth_user),
            "is_maintenance_set": app_config.malwarecage.enable_maintenance,
            "is_registration_enabled": app_config.malwarecage.enable_registration,
            "recaptcha_site_key": app_config.malwarecage.recaptcha_site_key,
            "base_url": app_config.malwarecage.base_url,
            "active_plugins": active_plugins
        })
