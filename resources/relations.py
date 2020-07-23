from flask_restful import Resource
from werkzeug.exceptions import NotFound

from core.schema import RelationsSchema

from . import access_object, deprecated, requires_authorization


class RelationsResource(Resource):
    @deprecated
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object relations (deprecated)
        description: |
            Returns relations attached to an object.

            Deprecated: relations are already available via simple object get.
        security:
            - bearerAuth: []
        tags:
            - deprecated
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
                    schema: RelationsSchema
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        relations = RelationsSchema()
        dumped_relations = relations.dump(db_object)
        return dumped_relations
