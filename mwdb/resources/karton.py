from flask_restful import Resource
from werkzeug.exceptions import NotFound

from mwdb.schema.karton import KartonListResponseSchema

from . import access_object, requires_authorization


class KartonObjectResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object analyses
        description: |
            Returns information about spawned Karton analyses
            for provided object
        security:
            - bearerAuth: []
        tags:
            - object
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of target object
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
        responses:
            200:
                description: Information about analysis status
                content:
                  application/json:
                    schema: KartonListResponseSchema
            404:
                description: |
                    When object doesn't exist or user doesn't have access
                    to this object.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        status = db_object.get_analysis_status()
        schema = KartonListResponseSchema()
        return schema.dump({"status": status, "analyses": db_object.analyses})
