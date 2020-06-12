from flask import request, g
from flask_restful import Resource
from sqlalchemy.sql.expression import true
from werkzeug.exceptions import BadRequest, NotFound, Forbidden

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
        description: Get attributes of specified object
        security:
            - bearerAuth: []
        tags:
            - attribute
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of object (ignored)
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
            - in: query
              name: hidden
              schema:
                type: int
              description: Show hidden metakeys (requires 'reading_all_attributes' capability)
              required: false
        responses:
            200:
                description: Object attributes
                content:
                  application/json:
                    schema: MetakeyShowSchema
            403:
                description: When user requested hidden metakeys but doesn't have 'reading_all_attributes' capability
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        db_object = authenticated_access(Object, identifier)

        show_hidden = bool(int(request.args.get('hidden', '0')))
        if show_hidden and not g.auth_user.has_rights(Capabilities.reading_all_attributes):
            raise Forbidden("You are not permitted to read hidden metakeys")
        metakeys = db_object.get_metakeys(show_hidden=show_hidden)
        schema = MetakeyShowSchema()
        return schema.dump({"metakeys": metakeys})

    @requires_authorization
    def post(self, type, identifier):
        """
        ---
        description: Add attribute to specified object
        security:
            - bearerAuth: []
        tags:
            - attribute
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of object (ignored)
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
        requestBody:
            description: Attribute key and value
            content:
              application/json:
                schema: MetakeySchema
        responses:
            200:
                description: When metakey was added successfully
            404:
                description: |
                    When object doesn't exist or user doesn't have access to this object.
                    When attribute key is not defined or user doesn't have privileges to set that one.
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
        description: Get list of attribute keys which currently authenticated user can read or set
        security:
            - bearerAuth: []
        tags:
            - attribute
        parameters:
            - in: path
              name: access
              schema:
                type: string
                enum: [read, set]
              description: Type of desired access
        responses:
            200:
                description: List of attribute keys and definitions
                content:
                  application/json:
                    schema: MetakeyDefinitionListSchema
            400:
                description: When used unknown access type (other than read or set)
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
        description: Get list of metakey definitions. Requires 'managing_attributes' capability.
        security:
            - bearerAuth: []
        tags:
            - attribute
        responses:
            200:
                description: List of attribute keys and definitions
                content:
                  application/json:
                    schema: MetakeyDefinitionManageListSchema
            403:
                description: When user doesn't have 'managing_attributes' capability.
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
        description: Get attribute definition details. Requires 'managing_attributes' capability.
        security:
            - bearerAuth: []
        tags:
            - attribute
        parameters:
            - in: path
              name: key
              schema:
                type: string
              description: Attribute key
        responses:
            200:
                description: Attribute key definition
                content:
                  application/json:
                    schema: MetakeyDefinitionManageSchema
            403:
                description: When user doesn't have 'managing_attributes' capability.
            404:
                description: When specified attribute key doesn't exist
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
        description: Create or update attribute key definition. Requires 'managing_attributes' capability.
        security:
            - bearerAuth: []
        tags:
            - attribute
        parameters:
            - in: path
              name: key
              schema:
                type: string
              description: Attribute key
        requestBody:
            description: Attribute key definition
            content:
              application/json:
                schema: MetakeyDefinitionSchema
        responses:
            200:
                description: When metakey definition is successfully added
            400:
                description: When one of attribute definition fields is missing or incorrect.
            403:
                description: When user doesn't have 'managing_attributes' capability.
        """
        schema = MetakeyDefinitionSchema()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        key = obj.data['key'].strip().lower()
        url_template = obj.data.get('url_template')
        label = obj.data.get('label')
        description = obj.data.get('description')
        hidden = obj.data.get('hidden', False)

        metakey_definition = MetakeyDefinition(key=key,
                                               url_template=url_template,
                                               label=label,
                                               description=description,
                                               hidden=hidden)
        db.session.merge(metakey_definition)
        db.session.commit()


class MetakeyPermissionResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.managing_attributes)
    def put(self, key, group_name):
        """
        ---
        description: Add/modify group permission for specified attribute. Requires 'managing_attributes' capability.
        security:
            - bearerAuth: []
        tags:
            - attribute
        parameters:
            - in: path
              name: key
              schema:
                type: string
              description: Attribute key
            - in: path
              name: group_name
              schema:
                type: string
              description: Group name to add/modify
        requestBody:
            description: Attribute key permission definition
            content:
                application/json:
                  schema: MetakeyPermissionSchema
        responses:
            200:
                description: When group permission has been successfully changed
            400:
                description: When one of attribute permission fields is missing or incorrect.
            403:
                description: When user doesn't have 'managing_attributes' capability.
            404:
                description: When attribute key or group doesn't exist
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
        description: Remove group permission for specified attribute. Requires 'managing_attributes' capability.
        security:
            - bearerAuth: []
        tags:
            - attribute
        parameters:
            - in: path
              name: key
              schema:
                type: string
              description: Attribute key
            - in: path
              name: group_name
              schema:
                type: string
              description: Group name to remove
        responses:
            200:
                description: When group permission has been successfully removed
            403:
                description: When user doesn't have 'managing_attributes' capability.
            404:
                description: When attribute key or group or group permission doesn't exist
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
