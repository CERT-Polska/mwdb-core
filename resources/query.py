from flask import request, g, jsonify
from flask_restful import Resource
from werkzeug.exceptions import NotFound

from model import db, Query
from schema.query import QuerySchemaBase, QueryResponseSchema

from . import logger, requires_authorization


class QuickQueryResource(Resource):
    @requires_authorization
    def post(self, type):
        """
        ---
        summary: Create a new query
        description: Create a new saved quick query.
        tags:
            - query
        requestBody:
            description: Basic information for saving query
            content:
              application/json:
                schema: QuerySchemaBase
        responses:
            200:
                description: List of saved queries attached to the type of objects view.
                content:
                  application/json:
                    schema:
                      type: array
                      items: QueryResponseSchema
            400:
                description: When query is invalid
        """
        schema = QuerySchemaBase()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400
        quick_query = Query(
            query=obj.data["query"],
            name=obj.data["name"],
            type=obj.data["type"],
            user_id=g.auth_user.id,
        )
        db.session.add(quick_query)
        db.session.commit()
        logger.info('Query saved', extra={'query': quick_query.name})

        db.session.refresh(quick_query)
        schema = QueryResponseSchema()
        return schema.dump(quick_query)

    @requires_authorization
    def get(self, type):
        """
        ---
        summary: Get objects queries
        description: Returns all saved queries attached to the type of objects.
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
                      items: QueryResponseSchema
        """
        quick_queries = db.session.query(Query).filter(Query.type == type).filter(Query.user_id == g.auth_user.id).all()
        schema = QueryResponseSchema(many=True)
        return schema.dump(quick_queries)


class QuickQueryItemResource(Resource):
    @requires_authorization
    def delete(self, id):
        """
        ---
        summary: Delete query
        description: Delete custom quick query.
        tags:
            - query
        parameters:
            - in: path
              name: id
              schema:
                id: int
              description: Query identifier
        responses:
            404:
                descriptionL When query was not found.
            200:
                description: When query was successfully deleted
        """
        quick_query = db.session.query(Query).filter(Query.id == id).filter(Query.user_id == g.auth_user.id).first()
        if quick_query is None:
            raise NotFound("Query was not found")
        if quick_query is not None:
            db.session.delete(quick_query)
            logger.info('query deleted', extra={'query': id})
            db.session.commit()
