from flask import request, g
from flask_restful import Resource
from luqum.parser import ParseError
from werkzeug.exceptions import BadRequest

from model import db
from core.schema import SearchSchema, ObjectBase
from core.search import SQLQueryBuilderBaseException, search

from . import logger, requires_authorization


class SearchResource(Resource):
    @requires_authorization
    def post(self):
        """
        ---
        description: Advanced search with Lucene query syntax
        security:
            - bearerAuth: []
        tags:
            - search
        requestBody:
            description: Search query
            content:
              application/json:
                schema: SearchSchema
        responses:
            200:
                description: Resulting objects
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/ObjectBase'
        """
        schema = SearchSchema()

        obj = schema.loads(request.get_data(as_text=True))

        if obj.errors:
            return {"errors": obj.errors}, 400

        query = obj.data["query"]
        logger.info('search', extra={'query': query})

        try:
            db_query = search(query, g.auth_user)
            result = db_query(db.session()).all()
            schema = ObjectBase(many=True)
            return schema.dump(result)
        except SQLQueryBuilderBaseException as e:
            raise BadRequest(str(e))
        except ParseError as e:
            raise BadRequest(str(e))
