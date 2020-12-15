from flask_restful import Resource
import urllib3
from mwdb.core.config import app_config
from mwdb.schema.remotes import APIRemotesListResponseSchema
from . import requires_authorization


class APIRemotesListResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: Get list of configured remote names
        description: |
            Return a list of available remote names
        tags:
            - api_remote
        responses:
            description: List of user configured remotes
            content:
              application/json:
                schema: GroupListResponseSchema
        """
        remotes = app_config.mwdb.remotes
        schema = APIRemotesListResponseSchema()
        return schema.dump({"remotes": remotes})


class APiRemotesItemPullResource(Resource):
    session = urllib3.PoolManager()

    @requires_authorization
    def post(self, remote_name, type, identifier):
        """
        ---
        summary: Pulls object from remote to local instance
        description: |
            Pulls object from the remote instance to the local instance
        tags:
            - api_remote
        parameters:
            - in: path
              name: remote_name
              description: name of remote
              schema:
                type: string
            - in: path
              name: type
              description: Object type (object/file/config/blob)
              schema:
                type: string
            - in: path
              name: identifier
              description: Object identifier (SHA256/SHA512/SHA1/MD5)
              schema:
                type: string
        responses:
            description: Return information about pulled object
        """
        remote_url = app_config.get_key(f"remote:{remote_name}", "url")
        api_key = app_config.get_key(f"remote:{remote_name}", "api_key")
        response = self.session.request("GET", f"{remote_url}/{type}/{identifier}", preload_content=False,
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})

