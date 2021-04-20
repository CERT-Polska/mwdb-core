from flask import g, request
from flask_restful import Resource
from werkzeug.exceptions import NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.model import QuickQuery, db
from mwdb.schema.quick_query import QuickQueryResponseSchema, QuickQuerySchemaBase

from . import loads_schema, logger, requires_authorization, requires_capabilities


class QuickQueryResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.personalize)
    def post(self, type):
        """
        ---
        summary: Create a new query
        description: |
            Create a new saved quick query.

            Requires `personalize` capability.
        tags:
            - query
        requestBody:
            description: Basic information for saving query
            content:
              application/json:
                schema: QuickQuerySchemaBase
        responses:
            200:
                description: List of saved queries attached to the type of objects view.
                content:
                  application/json:
                    schema:
                      type: array
                      items: QuickQueryResponseSchema
            403:
                description: When user doesn't have `personalize` capability.
            400:
                description: When query is invalid
        """
        schema = QuickQuerySchemaBase()
        obj = loads_schema(request.get_data(as_text=True), schema)

        quick_query = QuickQuery(
            query=obj["query"],
            name=obj["name"],
            type=type,
            user_id=g.auth_user.id,
        )
        db.session.add(quick_query)
        db.session.commit()
        logger.info("Query saved", extra={"query": quick_query.name})

        db.session.refresh(quick_query)
        schema = QuickQueryResponseSchema()
        return schema.dump(quick_query)

    @requires_authorization
    def get(self, type):
        """
        ---
        summary: Get stored quick queries
        description: Returns all saved queries related with specified object type.
        tags:
            - query
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of objects view.
        responses:
            200:
                description: List of saved queries attached to the type of objects view.
                content:
                  application/json:
                    schema:
                      type: array
                      items: QuickQueryResponseSchema
        """
        quick_queries = (
            db.session.query(QuickQuery)
            .filter(QuickQuery.type == type)
            .filter(QuickQuery.user_id == g.auth_user.id)
            .all()
        )
        schema = QuickQueryResponseSchema(many=True)
        return schema.dump(quick_queries)


class QuickQueryItemResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.personalize)
    def delete(self, id):
        """
        ---
        summary: Delete query
        description: |
            Delete custom quick query.

            Requires `personalize` capability.
        tags:
            - query
        parameters:
            - in: path
              name: id
              schema:
                id: int
              description: Query identifier
        responses:
            200:
                description: When query was successfully deleted
            403:
                description: When user doesn't have `personalize` capability.
            404:
                description: When query was not found.
        """
        quick_query = (
            db.session.query(QuickQuery)
            .filter(QuickQuery.id == id)
            .filter(QuickQuery.user_id == g.auth_user.id)
            .first()
        )
        if quick_query is None:
            raise NotFound("Query was not found")

        db.session.delete(quick_query)
        logger.info("Query deleted", extra={"query": id})
        db.session.commit()
