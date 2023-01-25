from flask import g, request
from flask_restful import Resource
from werkzeug.exceptions import Forbidden, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.rate_limit import rate_limited_resource
from mwdb.model import Group, User, db
from mwdb.model.object import AccessType
from mwdb.schema.share import (
    ShareGroupListResponseSchema,
    ShareInfoResponseSchema,
    ShareListResponseSchema,
    ShareRequestSchema,
)

from . import access_object, loads_schema, logger, requires_authorization


@rate_limited_resource
class ShareGroupListResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: Get list of groups for share operation
        description: |
            Returns list of available groups that user can share objects with.

            If user doesn't have `sharing_with_all` capability,
            list includes only groups of which the user is a member.
        security:
            - bearerAuth: []
        tags:
            - share
        responses:
            200:
                description: Sharing info for object
                content:
                  application/json:
                    schema: ShareGroupListResponseSchema
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        if g.auth_user.has_rights(Capabilities.sharing_with_all):
            groups = db.session.query(Group.name)
        else:
            groups = db.session.query(Group.name).filter(
                g.auth_user.is_member(Group.id)
            )

        # Filter out groups that are created for pending users
        groups = groups.filter(
            Group.name.notin_(
                db.session.query(User.login).filter(User.pending.is_(True))
            )
        )

        group_names = [group[0] for group in groups.all()]
        schema = ShareGroupListResponseSchema()
        return schema.dump({"groups": group_names})


@rate_limited_resource
class ShareResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object shares
        description: |
            Returns list of available groups and sharing info for specified object.

            If user doesn't have `sharing_with_all` capability,
            only own groups are included.
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
              description: Type of object
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
                    schema: ShareInfoResponseSchema
            404:
                description: |
                    When object doesn't exist
                    or user doesn't have access to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        if g.auth_user.has_rights(Capabilities.sharing_with_all):
            groups = db.session.query(Group.name)
        else:
            groups = db.session.query(Group.name).filter(
                g.auth_user.is_member(Group.id)
            )

        # Filter out groups that are created for pending users
        groups = groups.filter(
            Group.name.notin_(
                db.session.query(User.login).filter(User.pending.is_(True))
            )
        )

        group_names = [group[0] for group in groups.all()]
        # User cannot share object with themself
        if g.auth_user.login in group_names:
            group_names.remove(g.auth_user.login)

        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        shares = db_object.get_uploaders() + db_object.get_shares()

        schema = ShareInfoResponseSchema()
        return schema.dump({"groups": group_names, "shares": shares})

    @requires_authorization
    def put(self, type, identifier):
        """
        ---
        summary: Share object with group
        description: |
            Shares object with another group.

            If user doesn't have `sharing_with_all` capability,
            it can share object only within its own groups.
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
              description: Object identifier
        requestBody:
            description: Group with whom object is shared
            content:
              application/json:
                schema: ShareRequestSchema
        responses:
            200:
                description: When object is successfully shared.
                content:
                  application/json:
                    schema: ShareListResponseSchema
            400:
                description: When request body is invalid.
            403:
                description: |
                    When user tries to share object with themself.
            404:
                description: |
                    When object or group doesn't exist
                    or user doesn't have access to.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        schema = ShareRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        group_name = obj["group"]
        group = db.session.query(Group).filter(Group.name == group_name)
        if not g.auth_user.has_rights(Capabilities.sharing_with_all):
            group = group.filter(g.auth_user.is_member(Group.id))
        group = group.first()

        if group is None or group.pending_group:
            raise NotFound(f"Group {group_name} doesn't exist")

        if group.name == g.auth_user.login:
            raise Forbidden("You cannot share object with yourself")

        db_object.give_access(group.id, AccessType.SHARED, db_object, g.auth_user)

        shares = db_object.get_shares()
        logger.info("Object shared", extra={"object": db_object.dhash, "group": group})
        schema = ShareListResponseSchema()
        return schema.dump({"shares": shares})
