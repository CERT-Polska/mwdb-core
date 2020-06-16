from operator import itemgetter

from flask import request, g
from flask_restful import Resource
from sqlalchemy import and_
from werkzeug.exceptions import NotFound

from model import db, Object, Group, ObjectPermission
from model.user import User
from core.capabilities import Capabilities
from core.schema import ShareSchema, ShareShowSchema
from model.object import AccessType

from . import authenticated_access, logger, requires_authorization


class ShareResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object shares
        description: |
            Returns list of available groups and sharing info for specified object

            If user doesn't have `sharing_objects` capability, only own groups are included.
        security:
            - bearerAuth: []
        tags:
            - share
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
        responses:
            200:
                description: Sharing info for object
                content:
                  application/json:
                    schema: ShareShowSchema
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        if g.auth_user.has_rights(Capabilities.sharing_objects):
            groups = list(map(itemgetter(0), db.session.query(Group.name).all()))
        else:
            groups = list(map(itemgetter(0), db.session.query(Group.name).filter(
                g.auth_user.is_member(Group.id)
            ).all()))

        db_object = authenticated_access(Object, identifier)

        permission_filter = (ObjectPermission.object_id == db_object.id)

        if not g.auth_user.has_rights(Capabilities.sharing_objects):
            permission_filter = and_(permission_filter, g.auth_user.is_member(ObjectPermission.group_id))

        shares = db.session.query(ObjectPermission) \
            .filter(permission_filter) \
            .order_by(ObjectPermission.access_time.desc()) \
            .all()

        schema = ShareShowSchema()
        return schema.dump({"groups": groups, "shares": shares})

    @requires_authorization
    def put(self, type, identifier):
        """
        ---
        summary: Share object with group
        description: |
            Shares object with another group.

            If user doesn't have `sharing_objects` capability, it can share object only within its own groups.
        security:
            - bearerAuth: []
        tags:
            - share
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
            description: Group with whom object is shared
            content:
              application/json:
                schema: ShareSchema
        responses:
            200:
                description: When object is successfully shared.
            400:
                description: When request body is invalid.
            404:
                description: When object or group doesn't exist or user doesn't have access to.
        """
        schema = ShareSchema()

        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        db_object = authenticated_access(Object, identifier)
        group_name = obj.data["group"]

        permission_filter = (Group.name == group_name)

        if not g.auth_user.has_rights(Capabilities.sharing_objects):
            permission_filter = and_(permission_filter, g.auth_user.is_member(Group.id))

        group = db.session.query(Group).filter(permission_filter).first()

        if group is None or group.pending_group:
            raise NotFound("Group {} doesn't exist".format(group_name))

        db_object.give_access(group.id, AccessType.SHARED, db_object, g.auth_user)
        logger.info('object shared', extra={'object': db_object.dhash, 'group': group})
