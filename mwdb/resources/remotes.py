from flask_restful import Resource
from mwdb.core.config import app_config
from mwdb.schema.remotes import APIRemotesListResponseSchema


class APIRemotesListResource(Resource):
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
