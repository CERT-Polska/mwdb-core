from flask import g, request
from flask_restful import Resource
from luqum.parser import ParseError
from werkzeug.exceptions import BadRequest

from model import db, Object
from core.schema import SearchSchema, ObjectBase
from core.search import SQLQueryBuilderBaseException, SQLQueryBuilder

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
            result = (
                SQLQueryBuilder().build_query(query)
                                 .filter(g.auth_user.has_access_to_object(Object.id))
                                 .order_by(Object.id.desc())
                                 .limit(10000)
            ).all()
        except SQLQueryBuilderBaseException as e:
            raise BadRequest(str(e))
        except ParseError as e:
            raise BadRequest(str(e))

        schema = ObjectBase(many=True)
        return schema.dump(result)
