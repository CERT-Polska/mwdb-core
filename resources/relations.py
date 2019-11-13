from flask_restful import Resource

from model import Object
from core.schema import RelationsSchema

from . import authenticated_access, requires_authorization


class RelationsResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        description: Get relations attached to an object
        security:
            - bearerAuth: []
        relations:
            - relation
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, object]
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
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/Relations'
        """
        db_object = authenticated_access(Object, identifier)

        relations = RelationsSchema()
        dumped_relations = relations.dump(db_object)
        return dumped_relations
