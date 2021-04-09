from flask_restful import Resource
from werkzeug.exceptions import NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.model import Object, db
from mwdb.schema.relations import RelationsResponseSchema

from . import access_object, logger, requires_authorization, requires_capabilities


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
                description: |
                    When object doesn't exist or user doesn't have
                    access to this object.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        relations = RelationsResponseSchema()
        return relations.dump(db_object)


class ObjectChildResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.adding_parents)
    def put(self, type, parent, child):
        """
        ---
        summary: Link existing objects
        description: |
            Add new relation between existing objects.

            Requires `adding_parents` capability.
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
              description: Type of parent object
            - in: path
              name: parent
              description: Identifier of the parent object
              required: true
              schema:
                type: string
            - in: path
              name: child
              description: Identifier of the child object
              required: true
              schema:
                type: string
        responses:
            200:
                description: When relation was successfully added
            403:
                description: When user doesn't have `adding_parents` capability.
            404:
                description: |
                    When one of objects doesn't exist or user
                    doesn't have access to object.
        """
        parent_object = access_object(type, parent)
        if parent_object is None:
            raise NotFound("Parent object not found")

        child_object = Object.access(child)
        if child_object is None:
            raise NotFound("Child object not found")

        child_object.add_parent(parent_object, commit=False)

        db.session.commit()
        logger.info(
            "Child added",
            extra={"parent": parent_object.dhash, "child": child_object.dhash},
        )

    @requires_authorization
    @requires_capabilities(Capabilities.removing_parents)
    def delete(self, type, parent, child):
        """
        ---
        summary: Remove relation between existing objects
        description: |
            Remove relation between existing objects with permission inheritance.

            Requires `adding_parents` capability.
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
              description: Type of parent object
            - in: path
              name: parent
              description: Identifier of the parent object
              required: true
              schema:
                type: string
            - in: path
              name: child
              description: Identifier of the child object
              required: true
              schema:
                type: string
        responses:
            200:
                description: When relation was successfully added
            403:
                description: When user doesn't have `adding_parents` capability.
            404:
                description: |
                    When one of objects doesn't exist or user
                    doesn't have access to object.
        """
        parent_object = access_object(type, parent)
        if parent_object is None:
            raise NotFound("Parent object not found")

        child_object = Object.access(child)
        if child_object is None:
            raise NotFound("Child object not found")

        child_object.remove_parent(parent_object)
        logger.info(
            "Child removed",
            extra={"parent": parent_object.dhash, "child": child_object.dhash},
        )
