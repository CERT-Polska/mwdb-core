from flask_restful import Resource
from werkzeug.exceptions import NotFound

from schema.relations import RelationsResponseSchema

from . import access_object, requires_authorization


class RelationsResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object relations
        description: |
            Returns relations attached to an object.

            Note: relations are already available via simple object get.
        security:
            - bearerAuth: []
        tags:
            - relations
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
              description: SHA256 object unique identifier
        responses:
            200:
                description: Relations object
                content:
                  application/json:
                    schema: RelationsResponseSchema
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        relations = RelationsResponseSchema()
        return relations.dump(db_object)
