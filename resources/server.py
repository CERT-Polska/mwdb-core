from flask import g, current_app
from flask_restful import Resource
from core.schema import PingStatusSchema, ServerInfoSchema
from version import app_build_version
from core.util import is_maintenance_set, is_registration_enabled


class PingResource(Resource):
    def get(self):
        """
        ---
        description: check if the service is working (useful for tests)
        tags:
            - server
        responses:
            200:
              description: successful ping response
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
        description: fetch server info and client-side configuration
        tags:
            - server
        responses:
            200:
              description: server info with client-side configuration
              content:
                application/json:
                  schema: ServerInfoSchema
        """
        schema = ServerInfoSchema()
        return schema.dump({
            "server_version": app_build_version,
            "is_authenticated": bool(g.auth_user),
            "is_maintenance_set": is_maintenance_set(),
            "is_registration_enabled": is_registration_enabled(),
            "recaptcha_site_key": current_app.config.get('RECAPTCHA_SITE_KEY')
        })
