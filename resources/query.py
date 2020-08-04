from flask import request, g, jsonify
from flask_restful import Resource
from model import db, Query

from schema.query import QuerySchemaBase, QueryResponseSchema

from . import logger, requires_capabilities, requires_authorization, access_object


class QueriesGetResource(Resource):
    @requires_authorization
    def get(self, type):
        query = db.session.query(Query).filter(Query.type == type).all()
        schema = QueryResponseSchema(many=True)
        return schema.dump(query)


class QueryResource(Resource):
    @requires_authorization
    def post(self):
        schema = QuerySchemaBase()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400
        query = Query(
            query=obj.data["query"],
            name=obj.data["name"],
            type=obj.data["type"],
            user_id=g.auth_user.id,
        )
        db.session.add(query)
        db.session.commit()
        logger.info('Query saved', extra={'query': query.name})

        db.session.refresh(query)
        schema = QueryResponseSchema()
        return schema.dump(query)


class QueryDeleteResource(Resource):
    @requires_authorization
    def delete(self, id):
        query = db.session.query(Query).filter(Query.id == id).first()

        if query is not None:
            db.session.delete(query)
            logger.info('query deleted', extra={'query': id})
            db.session.commit()
