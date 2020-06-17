import datetime

from flask import request, g
from flask_restful import Resource
from sqlalchemy import exists
from sqlalchemy.sql.expression import true

from werkzeug.exceptions import Conflict, Forbidden, NotFound, InternalServerError

from model import db, User, Group
from core.capabilities import Capabilities
from core.config import app_config
from core.mail import MailError, send_email_notification
from core.schema import UserSuccessSchema, MultiUserShowSchema, UserLoginSchemaBase, UserProfileSchema, UserManageSchema, \
    UserProfileManageInfoSchema

from . import logger, requires_capabilities, requires_authorization


class UserListResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def get(self):
        """
        ---
        summary: List of users
        description: |
            Returns list of all users.

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - user
        parameters:
            - in: query
              name: pending
              schema:
                type: string
              required: false
              description: |
                If set to non-empty value: returns pending users.
                Otherwise it returns only registered users excluding pending registrations.
        responses:
            200:
                description: List of users
                content:
                  application/json:
                    schema: MultiUserShowSchema
            403:
                description: When user doesn't have `manage_users` capability.
        """
        pending = bool(request.args.get('pending', False))
        objs = db.session.query(User).filter(User.pending == pending).all()
        schema = MultiUserShowSchema()
        return schema.dump({"users": objs})


class UserPendingResource(Resource):
    @requires_capabilities(Capabilities.manage_users)
    def post(self, login):
        """
        ---
        summary: Accept pending registration
        description: |
            Accepts pending user registration.

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - user
        parameters:
            - in: path
              name: login
              schema:
                type: string
              description: Login of pending account
        responses:
            200:
                description: When user is successfully accepted
                content:
                  application/json:
                    schema: UserSuccessSchema
            400:
                description: When invalid login is provided.
            403:
                description: When user doesn't have `manage_users` capability.
            500:
                description: When SMTP server is unavailable or not properly configured on the server.
        """
        user_login_obj = UserLoginSchemaBase().load({"login": login})
        if user_login_obj.errors:
            return {"errors": user_login_obj.errors}, 400

        user = db.session.query(User).filter(User.login == login, User.pending == true()).first()
        user.pending = False
        user.registered_on = datetime.datetime.now()
        user.registered_by = g.auth_user.id
        db.session.add(user)

        try:
            send_email_notification("register",
                                    "New account registered in Malwarecage",
                                    user.email,
                                    base_url=app_config.malwarecage.base_url,
                                    login=user.login,
                                    set_password_token=user.generate_set_password_token().decode("utf-8"))
        except MailError:
            logger.exception("Can't send e-mail notification")
            raise InternalServerError("SMTP server needed to fulfill this request is not configured or unavailable.")

        db.session.commit()

        logger.info('User accepted', extra={'user': user.login})
        schema = UserSuccessSchema()
        return schema.dump({"login": user.login})

    @requires_capabilities(Capabilities.manage_users)
    def delete(self, login):
        """
        ---
        summary: Reject pending registration
        description: |
            Rejects pending user registration.

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - user
        parameters:
            - in: path
              name: login
              schema:
                type: string
              description: Login of pending account
        responses:
            200:
                description: When user is successfully rejected
                content:
                  application/json:
                    schema: UserSuccessSchema
            400:
                description: When invalid login is provided.
            403:
                description: When user doesn't have `manage_users` capability.
            404:
                description: When user doesn't exist or is already accepted/rejected.
            500:
                description: When SMTP server is unavailable or not properly configured on the server.
        """
        user_login_obj = UserLoginSchemaBase().load({"login": login})
        if user_login_obj.errors:
            return {"errors": user_login_obj.errors}, 400

        user = db.session.query(User).filter(User.login == login, User.pending == true()).first()
        if not user:
            raise NotFound("User doesn't exist or is already rejected")
        group = db.session.query(Group).filter(Group.name == login).first()
        user.groups.remove(group)
        db.session.delete(group)
        db.session.delete(user)
        db.session.commit()

        try:
            send_email_notification("rejection",
                                    "Malwarecage account request has been rejected",
                                    user.email,
                                    base_url=app_config.malwarecage.base_url,
                                    login=user.login,
                                    set_password_token=user.generate_set_password_token().decode("utf-8"))
        except MailError:
            logger.exception("Can't send e-mail notification")
            raise InternalServerError("SMTP server needed to fulfill this request is not configured or unavailable.")

        logger.info('User rejected', extra={'user': login})
        schema = UserSuccessSchema()
        return schema.dump({"login": login})


class UserResource(Resource):
    @requires_authorization
    def get(self, login):
        """
        ---
        summary: Get user information
        description: |
            Returns information about user.

            If login doesn't match the login of currently authenticated user - `manage_users` capability is required.
        security:
            - bearerAuth: []
        tags:
            - user
        parameters:
            - in: path
              name: login
              schema:
                type: string
              description: User login
        responses:
            200:
                description: User information
                content:
                  application/json:
                    schema: UserProfileSchema
            403:
                description: When user doesn't have `manage_users` capability.
        """
        obj = db.session.query(User).filter(User.login == login).first()
        if not g.auth_user.has_rights(Capabilities.manage_users):
            if g.auth_user.login != login:
                raise Forbidden("You are not permitted to perform this action")
            schema = UserProfileSchema()
        else:
            schema = UserManageSchema()
        return schema.dump(obj)

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def post(self, login):
        """
        ---
        summary: Create new user
        description: |
            Creates new user account

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - user
        parameters:
            - in: path
              name: login
              schema:
                type: string
              description: New user login
        requestBody:
            description: User information
            content:
              application/json:
                schema: UserProfileManageInfoSchema
        responses:
            200:
                description: When user was created successfully
                content:
                  application/json:
                    schema: UserSuccessSchema
            400:
                description: When request body is invalid
            403:
                description: When user doesn't have `manage_users` capability.
            409:
                description: When user or group with provided name already exists.
            500:
                description: When SMTP server is unavailable or not properly configured on the server.
        """
        schema = UserProfileManageInfoSchema()

        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        user_login_obj = UserLoginSchemaBase().load({"login": login})
        if user_login_obj.errors:
            return {"errors": user_login_obj.errors}, 400

        if db.session.query(exists().where(User.login == login)).scalar():
            raise Conflict("User exists yet")

        if db.session.query(exists().where(Group.name == login)).scalar():
            raise Conflict("Group exists yet")

        user = User()
        user.login = login
        user.email = obj.data.get("email")
        user.additional_info = obj.data.get("additional_info")
        user.feed_quality = obj.data.get("feed_quality")
        user.disabled = False
        user.pending = False
        user.registered_by = g.auth_user.id
        user.registered_on = datetime.datetime.now()
        user.groups.append(Group.public_group())
        user.reset_sessions()
        db.session.add(user)

        group = Group()
        group.name = login
        group.private = True
        group.users.append(user)
        db.session.add(group)

        if obj.data.get("send_email", False):
            try:
                send_email_notification("register",
                                        "New account registered in Malwarecage",
                                        user.email,
                                        base_url=app_config.malwarecage.base_url,
                                        login=user.login,
                                        set_password_token=user.generate_set_password_token().decode("utf-8"))
            except MailError:
                logger.exception("Can't send e-mail notification")
                raise InternalServerError("SMTP server needed to fulfill this request is"
                                          " not configured or unavailable.")

        db.session.commit()

        logger.info('User created', extra={'user': user.login})
        schema = UserSuccessSchema()
        return schema.dump({"login": user.login})

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def put(self, login):
        """
        ---
        summary: Update existing user
        description: |
            Updates existing user account.

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - user
        parameters:
            - in: path
              name: login
              schema:
                type: string
              description: User login
        requestBody:
            description: User information
            content:
              application/json:
                schema: UserProfileManageInfoSchema
        responses:
            200:
                description: When user was updated successfully
                content:
                  application/json:
                    schema: UserSuccessSchema
            400:
                description: When request body is invalid
            403:
                description: When user doesn't have `manage_users` capability or modified user is pending.
            404:
                description: When user doesn't exist.
        """
        schema = UserProfileManageInfoSchema()

        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400

        user_login_obj = UserLoginSchemaBase().load({"login": login})
        if user_login_obj.errors:
            return {"errors": user_login_obj.errors}, 400

        user = db.session.query(User).filter(User.login == login).first()
        if user is None:
            raise NotFound("No such user")

        if user.pending:
            raise Forbidden("User is pending and need to be accepted first")

        email = obj.data.get("email")
        if email is not None:
            user.email = email

        additional_info = obj.data.get("additional_info")
        if additional_info is not None:
            user.additional_info = additional_info

        feed_quality = obj.data.get("feed_quality")
        if feed_quality is not None:
            user.feed_quality = feed_quality

        disabled = obj.data.get("disabled")
        if disabled is not None:
            user.disabled = disabled
            user.reset_sessions()

        db.session.add(user)
        db.session.commit()
        logger.info('user updated', extra=obj.data)

        schema = UserSuccessSchema()
        return schema.dump({"login": login})

