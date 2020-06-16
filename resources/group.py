from flask import request
from flask_restful import Resource
from sqlalchemy.orm import joinedload
from sqlalchemy import exists
from werkzeug.exceptions import NotFound, Conflict, Forbidden

from model import db, Group, User
from core.capabilities import Capabilities
from core.schema import GroupSchema, MultiGroupShowSchema, GroupNameSchemaBase, UserLoginSchemaBase

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

            Requires 'manage_users' capability.
        security:
            - bearerAuth: []
        tags:
            - group
        responses:
            200:
                description: List of groups
                content:
                  application/json:
                    schema: MultiGroupShowSchema
            403:
                description: When user doesn't have 'manage_users' capability.
        """
        objs = db.session.query(Group).options(joinedload(Group.users)).all()
        schema = MultiGroupShowSchema()
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

            Requires 'manage_users' capability.
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
                description: List of groups
                content:
                  application/json:
                    schema: MultiGroupShowSchema
            403:
                description: When user doesn't have 'manage_users' capability.
            404:
                description: When group doesn't exist
        """
        obj = db.session.query(Group).options(joinedload(Group.users)).filter(Group.name == name).first()
        if obj is None:
            raise NotFound("No such group")
        schema = GroupSchema()
        return schema.dump(obj)

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def post(self, name):
        """
        ---
        summary: Create new group
        description: |
            Creates a new group.

            Requires 'manage_users' capability.
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
                description: When group was created successfully
            400:
                description: When group name or request body is invalid
            403:
                description: When user doesn't have 'manage_users' capability
            409:
                description: When group exists yet
        """
        schema = GroupSchema()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        group_name_obj = GroupNameSchemaBase().load({"name": name})
        if group_name_obj.errors:
            return {"errors": group_name_obj.errors}, 400

        if db.session.query(exists().where(Group.name == name)).scalar():
            raise Conflict("Group exists yet")

        group = Group()
        group.name = name
        group.capabilities = obj.data.get("capabilities") or []
        db.session.add(group)
        db.session.commit()

        logger.info('group created', extra={
            'group': group.name,
            'capabilities': group.capabilities
        })
        schema = GroupSchema()
        return schema.dump({"name": obj.data.get("name")})

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def put(self, name):
        """
        ---
        summary: Update group name and capabilities
        description: |
            Updates group name and capabilities.

            Works only for user-defined groups (excluding private and 'public')

            Requires 'manage_users' capability.
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
                description: When group was updated successfully
            400:
                description: When group name or request body is invalid
            403:
                description: When user doesn't have 'manage_users' capability or group is immutable
            404:
                description: When group doesn't exist
        """
        obj = GroupSchema().loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        group_name_obj = GroupNameSchemaBase().load({"name": name})
        if group_name_obj.errors:
            return {"errors": group_name_obj.errors}, 400

        group = db.session.query(Group).filter(Group.name == name).first()
        if group is None:
            raise NotFound("No such group")

        params = dict(capabilities=obj.data.get("capabilities", group.capabilities),
                      name=obj.data.get("name", name))

        if params["name"] != name and group.immutable:
            raise Forbidden("Renaming group not allowed - group is immutable")

        db.session.query(Group) \
            .filter(Group.name == name) \
            .update(params)

        # Invalidate all sessions due to potentially changed capabilities
        for member in group.users:
            member.reset_sessions()
            db.session.add(member)

        db.session.commit()

        logger.info('group updated', extra={"group": params["name"]})
        schema = GroupSchema()
        return schema.dump({"name": params["name"]})


class GroupMemberResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def put(self, name, login):
        """
        ---
        summary: Add member to group
        description: |
            Adds new member to existing group

            Works only for user-defined groups (excluding private and 'public')

            Requires 'manage_users' capability.
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
            400:
                description: When request body is invalid
            403:
                description: When user doesn't have 'manage_users' capability, group is immutable or user is pending
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
        db.session.add(member)
        db.session.add(group)
        db.session.commit()

        logger.info('Group member added', extra={'user': member.login, 'group': group.name})
        schema = GroupSchema()
        return schema.dump({"name": name})

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def delete(self, name, login):
        """
        ---
        summary: Delete member from group
        description: |
            Removes member from existing group

            Works only for user-defined groups (excluding private and 'public')

            Requires 'manage_users' capability.
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
            400:
                description: When request body is invalid
            403:
                description: When user doesn't have 'manage_users' capability, group is immutable or user is pending
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
        db.session.add(member)
        db.session.add(group)
        db.session.commit()

        logger.info('Group member deleted', extra={'user': member.login, 'group': group.name})
        schema = GroupSchema()
        return schema.dump({"name": name})
