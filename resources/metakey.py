from flask import request
from flask_restful import Resource
from werkzeug.exceptions import NotFound

from core.capabilities import Capabilities
from core.schema import MetakeyShowSchema, MetakeySchema, MetakeyDefinitionShowSchema, MetakeyDefinitionSchema
from model import db, Object, MetakeyDefinition
from . import requires_capabilities, authenticated_access, requires_authorization


class MetakeyResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.reading_attributes)
    def get(self, type, identifier):
        """
        ---
        description: Get metakeys for specified object
        security:
            - bearerAuth: []
        tags:
            - metakey
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
              description: Object's id
        responses:
            200:
                description: Object metakeys
                content:
                  application/json:
                    schema: MetakeyShowSchema
            404:
                description: When object doesn't exist
        """
        db_object = authenticated_access(Object, identifier)
        metakeys = db_object.get_metakeys()
        schema = MetakeyShowSchema()
        return schema.dump({"metakeys": metakeys})

    @requires_authorization
    @requires_capabilities(Capabilities.adding_attributes)
    def post(self, type, identifier):
        """
        ---
        description: Add metakey for specified object
        security:
            - bearerAuth: []
        tags:
            - metakey
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
              description: Object's id
        requestBody:
            description: Metakey description
            content:
              application/json:
                schema: MetakeySchema
        responses:
            200:
                description: When metakey was added successfully
            404:
                description: When object doesn't exist
        """
        schema = MetakeySchema()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        db_object = authenticated_access(Object, identifier)
        key = obj.data['key'].strip().lower()
        value = obj.data['value']
        is_new = db_object.add_metakey(key, value)

        db.session.commit()
        return {"modified": is_new}, 200


class MetakeyListDefinitionResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.managing_attributes)
    def get(self):
        """
        ---
        description: Get list of known metakey definitions
        security:
            - bearerAuth: []
        tags:
            - metakey
        responses:
            200:
                description: metakeys
                content:
                  application/json:
                    schema: MetakeyDefinitionShowSchema
        """
        metakeys = db.session.query(MetakeyDefinition) \
                             .order_by(MetakeyDefinition.key) \
                             .all()
        schema = MetakeyDefinitionShowSchema()
        return schema.dump({"metakeys": metakeys})


class MetakeyDefinitionResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.managing_attributes)
    def get(self, key):
        """
        ---
        description: Get metakey definition
        security:
            - bearerAuth: []
        tags:
            - metakey
        parameters:
            - in: path
              name: key
              schema:
                type: string
              description: Metakey
        responses:
            200:
                description: Metakey definitions
                content:
                  application/json:
                    schema: MetakeyDefinitionSchema
        """
        metakey = db.session.query(MetakeyDefinition) \
                            .filter(MetakeyDefinition.key == key) \
                            .first()
        if metakey is None:
            raise NotFound("No such metakey")
        schema = MetakeyDefinitionSchema()
        return schema.dump(metakey)

    @requires_authorization
    @requires_capabilities(Capabilities.managing_attributes)
    def post(self, key):
        """
        ---
        description: Create new metakey definition
        security:
            - bearerAuth: []
        tags:
            - metakey
        parameters:
            - in: path
              name: key
              schema:
                type: string
              description: Metakey
        requestBody:
            description: Metakey definition
            content:
              application/json:
                schema: MetakeyDefinitionSchema
        responses:
            200:
                description: When metakey definition is successfully added
        """
        schema = MetakeyDefinitionSchema()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        key = obj.data['key'].strip().lower()
        url_template = obj.data.get('url_template')

        metakey_definition = MetakeyDefinition(key=key, url_template=url_template)
        db.session.merge(metakey_definition)
        db.session.commit()
