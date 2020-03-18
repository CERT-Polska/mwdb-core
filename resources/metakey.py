from flask import request, g
from flask_restful import Resource
from sqlalchemy.sql.expression import true
from werkzeug.exceptions import BadRequest, NotFound

from core.capabilities import Capabilities
from core.schema import MetakeyShowSchema, MetakeySchema, MetakeyDefinitionManageSchema, \
    MetakeyDefinitionManageListSchema, MetakeyDefinitionSchema, MetakeyDefinitionListSchema, MetakeyPermissionSchema
from model import db, Object, Group, MetakeyDefinition, MetakeyPermission
from . import requires_capabilities, authenticated_access, requires_authorization


class MetakeyResource(Resource):
    @requires_authorization
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
                enum: [file, config, blob, object]
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
                enum: [file, config, blob, object]
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
        if is_new is None:
            raise NotFound("Metakey '{}' not defined or insufficient permissions to set that one".format(key))

        db.session.commit()
        return {"modified": is_new}, 200


class MetakeyListDefinitionResource(Resource):
    @requires_authorization
    def get(self, access):
        """
        ---
        description: Get list of defined metakeys which user can read/set
        security:
            - bearerAuth: []
        tags:
            - metakey
        parameters:
            - in: path
              name: access
              schema:
                type: string
                enum: [read, set]
              description: Type of desired access
        responses:
            200:
                description: metakeys
                content:
                  application/json:
                    schema: MetakeyDefinitionListSchema
        """
        if access not in ["read", "set"]:
            raise BadRequest("Unknown desired access type '{}'".format(access))

        metakeys = db.session.query(MetakeyDefinition)

        if (access == "read" and not g.auth_user.has_rights(Capabilities.reading_all_attributes)) or \
           (access == "set" and not g.auth_user.has_rights(Capabilities.adding_all_attributes)):
            subquery = db.session.query(MetakeyPermission.key)
            if access == "read":
                subquery = subquery.filter(MetakeyPermission.can_read == true())
            elif access == "set":
                subquery = subquery.filter(MetakeyPermission.can_set == true())
            subquery = subquery.filter(g.auth_user.is_member(MetakeyPermission.group_id))
            metakeys = metakeys.filter(MetakeyDefinition.key.in_(subquery))

        metakeys = metakeys.order_by(MetakeyDefinition.key).all()
        schema = MetakeyDefinitionListSchema()
        return schema.dump({"metakeys": metakeys})


class MetakeyListDefinitionManageResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.managing_attributes)
    def get(self):
        """
        ---
        description: Get management list of metakey definitions
        security:
            - bearerAuth: []
        tags:
            - metakey
        responses:
            200:
                description: metakeys
                content:
                  application/json:
                    schema: MetakeyDefinitionManageListSchema
        """
        metakeys = db.session.query(MetakeyDefinition).order_by(MetakeyDefinition.key).all()
        schema = MetakeyDefinitionManageListSchema()
        return schema.dump({"metakeys": metakeys})


class MetakeyDefinitionManageResource(Resource):
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
                    schema: MetakeyDefinitionManageSchema
        """
        metakey = db.session.query(MetakeyDefinition) \
                            .filter(MetakeyDefinition.key == key) \
                            .first()
        if metakey is None:
            raise NotFound("No such metakey")
        schema = MetakeyDefinitionManageSchema()
        return schema.dump(metakey)

    @requires_authorization
    @requires_capabilities(Capabilities.managing_attributes)
    def put(self, key):
        """
        ---
        description: Update new metakey definition
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
        label = obj.data.get('label')
        description = obj.data.get('description')

        metakey_definition = MetakeyDefinition(key=key,
                                               url_template=url_template,
                                               label=label,
                                               description=description)
        db.session.merge(metakey_definition)
        db.session.commit()


class MetakeyPermissionResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.managing_attributes)
    def put(self, key, group_name):
        """
        ---
        description: Modify group permission for specified metakey
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
            description: Metakey permission definition
            content:
                application/json:
                  schema: MetakeyPermissionSchema
        responses:
            200:
                description: When group permission has been successfully changed
        """
        schema = MetakeyPermissionSchema()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        metakey_definition = db.session.query(MetakeyDefinition).filter(MetakeyDefinition.key == key)
        if metakey_definition is None:
            raise NotFound("No such metakey")

        group = db.session.query(Group).filter(Group.name == obj.data["group_name"]).first()
        if group is None:
            raise NotFound("No such group")

        permission = MetakeyPermission(
            key=key,
            group_id=group.id,
            can_read=obj.data["can_read"],
            can_set=obj.data["can_set"]
        )
        db.session.merge(permission)
        db.session.commit()

    @requires_authorization
    @requires_capabilities(Capabilities.managing_attributes)
    def delete(self, key, group_name):
        """
        ---
        description: Remove group permission for specified metakey
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
            - in: path
              name: group_name
              schema:
                type: string
              description: Group name to remove
        responses:
            200:
                description: When group permission has been successfully changed
        """
        group = db.session.query(Group).filter(Group.name == group_name).first()
        if group is None:
            raise NotFound("No such group")

        metakey_permission = db.session.query(MetakeyPermission).filter(
            MetakeyPermission.key == key,
            MetakeyPermission.group_id == group.id).first()

        if metakey_permission is None:
            raise NotFound("No such metakey permission")

        db.session.delete(metakey_permission)
        db.session.commit()
