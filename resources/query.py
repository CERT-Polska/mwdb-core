from flask import request, g
from flask_restful import Resource

from model import db, Query

from schema.query import QuerySchemaBase, QueryResponseSchema

from . import logger, requires_capabilities, requires_authorization, access_object


class QueryResource(Resource):
    @requires_authorization
    def get(self, type):
        query = db.session.query(Query).filter(Query.type == type).all()
        schema = QueryResponseSchema(many=True)
        return schema.dump(query)

    @requires_authorization
    def post(self, type):

        schema = QuerySchemaBase()
        obj = schema.loads(request.get_data(as_text=True))
        print(obj)
        print(obj.data)
        query = Query(
            query=obj.data["query"],
            name=obj.data["name"],
            type=type,
            user_id=g.auth_user.id,
        )
        db.session.add(query)
        db.session.commit()
        logger.info('Query saved', extra={'query': query.name})

        db.session.refresh(query)
        schema = QueryResponseSchema()
        print("POSZŁO!")
        return schema.dump(query)


class QueryDeleteResource(Resource):
    @requires_authorization
    def delete(self, query_id):
        query = db.session.query(Query).filter(Query.id == query_id).first()

        if query is not None:
            db.session.delete(query)
            logger.info('query deleted', extra={'query': query_id})
            db.session.commit()
