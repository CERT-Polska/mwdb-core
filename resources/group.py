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
        objs = db.session.query(Group).options(joinedload(Group.users)).all()
        schema = MultiGroupShowSchema()
        return schema.dump({"groups": objs})


class GroupResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def get(self, name):
        obj = db.session.query(Group).options(joinedload(Group.users)).filter(Group.name == name).first()
        if obj is None:
            raise NotFound("No such group")
        schema = GroupSchema()
        return schema.dump(obj)

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def post(self, name):
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
