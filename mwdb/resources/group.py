from flask import request
from flask_restful import Resource
from sqlalchemy.orm import joinedload
from sqlalchemy import exists
from werkzeug.exceptions import NotFound, Conflict, Forbidden

from mwdb.core.capabilities import Capabilities
from mwdb.model import db, Group, User
from mwdb.schema.user import UserLoginSchemaBase
from mwdb.schema.group import (
    GroupNameSchemaBase,
    GroupCreateRequestSchema,
    GroupUpdateRequestSchema,
    GroupItemResponseSchema,
    GroupListResponseSchema,
    GroupSuccessResponseSchema
)

from . import logger, requires_capabilities, requires_authorization


class GroupListResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def get(self):
        """
        ---
        summary: List of groups
        description: |
            Returns list of all groups and members.

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - group
        responses:
            200:
                description: List of groups
                content:
                  application/json:
                    schema: GroupListResponseSchema
            403:
                description: When user doesn't have `manage_users` capability.
        """
        objs = db.session.query(Group).options(joinedload(Group.users)).all()
        schema = GroupListResponseSchema()
        return schema.dump({"groups": objs})


class GroupResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def get(self, name):
        """
        ---
        summary: Get group
        description: |
            Returns information about group.

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - group
        parameters:
            - in: path
              name: name
              schema:
                type: string
              description: Group name
        responses:
            200:
                description: Group information
                content:
                  application/json:
                    schema: GroupItemResponseSchema
            403:
                description: When user doesn't have `manage_users` capability.
            404:
                description: When group doesn't exist
        """
        obj = db.session.query(Group).options(joinedload(Group.users)).filter(Group.name == name).first()
        if obj is None:
            raise NotFound("No such group")
        schema = GroupItemResponseSchema()
        return schema.dump(obj)

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def post(self, name):
        """
        ---
        summary: Create a new group
        description: |
            Creates a new group.

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - group
        parameters:
            - in: path
              name: name
              schema:
                type: string
              description: Group name
        requestBody:
            description: Group information
            content:
              application/json:
                schema: GroupCreateRequestSchema
        responses:
            200:
                description: When group was created successfully
                content:
                  application/json:
                    schema: GroupSuccessResponseSchema
            400:
                description: When group name or request body is invalid
            403:
                description: When user doesn't have `manage_users` capability
            409:
                description: When group exists yet
        """
        schema = GroupCreateRequestSchema()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        group_name_obj = GroupNameSchemaBase().load({"name": name})
        if group_name_obj.errors:
            return {"errors": group_name_obj.errors}, 400

        if db.session.query(exists().where(Group.name == name)).scalar():
            raise Conflict("Group exists yet")

        group = Group(
            name=name,
            capabilities=obj.data["capabilities"]
        )
        db.session.add(group)
        db.session.commit()

        logger.info('Group created', extra={
            'group': group.name,
            'capabilities': group.capabilities
        })
        schema = GroupSuccessResponseSchema()
        return schema.dump({"name": name})

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def put(self, name):
        """
        ---
        summary: Update group name and capabilities
        description: |
            Updates group name and capabilities.

            Works only for user-defined groups (excluding private and 'public')

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - group
        parameters:
            - in: path
              name: name
              schema:
                type: string
              description: Group name
        requestBody:
            description: Group information
            content:
              application/json:
                schema: GroupUpdateRequestSchema
        responses:
            200:
                description: When group was updated successfully
                content:
                  application/json:
                    schema: GroupSuccessResponseSchema
            400:
                description: When group name or request body is invalid
            403:
                description: When user doesn't have `manage_users` capability or group is immutable
            404:
                description: When group doesn't exist
        """
        schema = GroupUpdateRequestSchema()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        group_name_obj = GroupNameSchemaBase().load({"name": name})
        if group_name_obj.errors:
            return {"errors": group_name_obj.errors}, 400

        group = db.session.query(Group).filter(Group.name == name).first()
        if group is None:
            raise NotFound("No such group")

        if obj.data["name"] is not None:
            if obj.data["name"] != name and group.immutable:
                raise Forbidden("Renaming group not allowed - group is immutable")
            group.name = obj.data["name"]

        if obj.data["capabilities"] is not None:
            group.capabilities = obj.data["capabilities"]

        # Invalidate all sessions due to potentially changed capabilities
        for member in group.users:
            member.reset_sessions()

        db.session.commit()

        logger.info('Group updated', extra={
            "group": group.name,
            "capabilities": group.capabilities
        })
        schema = GroupSuccessResponseSchema()
        return schema.dump({"name": group.name})


class GroupMemberResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def put(self, name, login):
        """
        ---
        summary: Add a member to the specified group
        description: |
            Adds new member to existing group.

            Works only for user-defined groups (excluding private and 'public')

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - group
        parameters:
            - in: path
              name: name
              schema:
                type: string
              description: Group name
            - in: path
              name: login
              schema:
                type: string
              description: Member login
        responses:
            200:
                description: When member was added successfully
                content:
                  application/json:
                    schema: GroupSuccessResponseSchema
            400:
                description: When request body is invalid
            403:
                description: When user doesn't have `manage_users` capability, group is immutable or user is pending
            404:
                description: When user or group doesn't exist
        """
        group_name_obj = GroupNameSchemaBase().load({"name": name})
        if group_name_obj.errors:
            return {"errors": group_name_obj.errors}, 400

        user_login_obj = UserLoginSchemaBase().load({"login": login})
        if user_login_obj.errors:
            return {"errors": user_login_obj.errors}, 400

        member = db.session.query(User).filter(User.login == login).first()
        if member is None:
            raise NotFound("No such user")

        if member.pending:
            raise Forbidden("User is pending and need to be accepted first")

        group = db.session.query(Group).options(joinedload(Group.users)).filter(Group.name == name).first()
        if group is None:
            raise NotFound("No such group")

        if group.immutable:
            raise Forbidden("Adding members to private or public group is not allowed")

        group.users.append(member)
        member.reset_sessions()
        db.session.commit()

        logger.info('Group member added', extra={'user': member.login, 'group': group.name})
        schema = GroupSuccessResponseSchema()
        return schema.dump({"name": name})

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def delete(self, name, login):
        """
        ---
        summary: Delete member from group
        description: |
            Removes member from existing group.

            Works only for user-defined groups (excluding private and 'public')

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - group
        parameters:
            - in: path
              name: name
              schema:
                type: string
              description: Group name
            - in: path
              name: login
              schema:
                type: string
              description: Member login
        responses:
            200:
                description: When member was removed successfully
                content:
                  application/json:
                    schema: GroupSuccessResponseSchema
            400:
                description: When request body is invalid
            403:
                description: When user doesn't have `manage_users` capability, group is immutable or user is pending
            404:
                description: When user or group doesn't exist
        """
        group_name_obj = GroupNameSchemaBase().load({"name": name})
        if group_name_obj.errors:
            return {"errors": group_name_obj.errors}, 400

        user_login_obj = UserLoginSchemaBase().load({"login": login})
        if user_login_obj.errors:
            return {"errors": user_login_obj.errors}, 400

        member = db.session.query(User).filter(User.login == login).first()
        if member is None:
            raise NotFound("No such user")

        if member.pending:
            raise Forbidden("User is pending and need to be accepted first")

        group = db.session.query(Group).options(joinedload(Group.users)).filter(Group.name == name).first()
        if group is None:
            raise NotFound("No such group")

        if group.immutable:
            raise Forbidden("Removing members from private or public group is not allowed")

        group.users.remove(member)
        member.reset_sessions()
        db.session.commit()

        logger.info('Group member deleted', extra={'user': member.login, 'group': group.name})
        schema = GroupSuccessResponseSchema()
        return schema.dump({"name": name})
