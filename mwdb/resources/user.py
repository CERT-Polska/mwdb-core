import datetime

from flask import g, request
from flask_restful import Resource
from sqlalchemy import exists
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql.expression import true
from werkzeug.exceptions import Conflict, Forbidden, InternalServerError, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.core.mail import MailError, send_email_notification
from mwdb.model import Group, Member, User, db
from mwdb.schema.user import (
    UserCreateRequestSchema,
    UserItemResponseSchema,
    UserListResponseSchema,
    UserLoginSchemaBase,
    UserOwnProfileResponseSchema,
    UserProfileResponseSchema,
    UserRejectRequestArgsSchema,
    UserSetPasswordTokenResponseSchema,
    UserSuccessResponseSchema,
    UserUpdateRequestSchema,
)

from . import (
    load_schema,
    loads_schema,
    logger,
    requires_authorization,
    requires_capabilities,
)


class UserListResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def get(self):
        """
        ---
        summary: List all users
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
                Otherwise it returns only registered users excluding
                pending registrations.
        responses:
            200:
                description: List of users
                content:
                  application/json:
                    schema: UserListResponseSchema
            403:
                description: When user doesn't have `manage_users` capability.
        """
        pending = bool(request.args.get("pending", False))
        objs = db.session.query(User).filter(User.pending == pending).all()
        schema = UserListResponseSchema()
        return schema.dump({"users": objs})


class UserPendingResource(Resource):
    @requires_capabilities(Capabilities.manage_users)
    def post(self, login):
        """
        ---
        summary: Accept a pending registration
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
                    schema: UserSuccessResponseSchema
            400:
                description: When invalid login is provided.
            403:
                description: When user doesn't have `manage_users` capability.
            500:
                description: |
                    When SMTP server is unavailable or not properly
                    configured on the server.
        """
        user_login_obj = load_schema({"login": login}, UserLoginSchemaBase())

        user = (
            db.session.query(User)
            .filter(User.login == user_login_obj["login"], User.pending == true())
            .first()
        )
        user.pending = False
        user.registered_on = datetime.datetime.now()
        user.registered_by = g.auth_user.id
        db.session.add(user)

        try:
            send_email_notification(
                "register",
                "New account registered in MWDB",
                user.email,
                base_url=app_config.mwdb.base_url,
                login=user.login,
                set_password_token=user.generate_set_password_token().decode("utf-8"),
            )
        except MailError:
            logger.exception("Can't send e-mail notification")
            raise InternalServerError(
                "SMTP server needed to fulfill this request "
                "is not configured or unavailable."
            )

        db.session.commit()

        logger.info("User accepted", extra={"user": user.login})
        schema = UserSuccessResponseSchema()
        return schema.dump({"login": user.login})

    @requires_capabilities(Capabilities.manage_users)
    def delete(self, login):
        """
        ---
        summary: Reject a pending registration
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
                    schema: UserSuccessResponseSchema
            400:
                description: When invalid login is provided.
            403:
                description: When user doesn't have `manage_users` capability.
            404:
                description: When user doesn't exist or is already accepted/rejected.
            500:
                description: |
                    When SMTP server is unavailable or not properly configured
                    on the server.
        """
        user_login_obj = load_schema({"login": login}, UserLoginSchemaBase())

        obj = load_schema(request.args, UserRejectRequestArgsSchema())
        user = (
            db.session.query(User)
            .filter(User.login == user_login_obj["login"], User.pending == true())
            .first()
        )
        if not user:
            raise NotFound("User doesn't exist or is already rejected")
        group = (
            db.session.query(Group)
            .filter(Group.name == user_login_obj["login"])
            .first()
        )
        user.groups.remove(group)
        db.session.delete(group)
        db.session.delete(user)
        db.session.commit()
        if obj["send_email"]:
            try:
                send_email_notification(
                    "rejection",
                    "MWDB account request has been rejected",
                    user.email,
                    base_url=app_config.mwdb.base_url,
                    login=user.login,
                    set_password_token=user.generate_set_password_token().decode(
                        "utf-8"
                    ),
                )
            except MailError:
                logger.exception("Can't send e-mail notification")
                raise InternalServerError(
                    "SMTP server needed to fulfill this request "
                    "is not configured or unavailable."
                )

            logger.info(
                "User rejected with notification",
                extra={"user": user_login_obj["login"]},
            )
        else:
            logger.info(
                "User rejected without notification",
                extra={"user": user_login_obj["login"]},
            )

        schema = UserSuccessResponseSchema()
        return schema.dump({"login": user_login_obj["login"]})


class UserGetPasswordChangeTokenResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def get(self, login):
        """
        ---
        summary: Generate a password change token
        description: |
            Generates token for password change.

            Token expires after setting a new password or after 14 days.

            Requires `manage_users` capability.
        security:
            - bearerAuth: []
        tags:
            - user
        parameters:
            - in: path
              schema:
                type: string
              name: login
              required: true
        responses:
            200:
              description: Authorization token for password change
              content:
                application/json:
                  schema: UserSetPasswordTokenResponseSchema
            404:
                description: When specified user doesn't exist
        """
        try:
            user = User.query.filter(User.login == login).one()
        except NoResultFound:
            raise NotFound("User doesn't exist")

        token = user.generate_set_password_token()

        logger.info("Set password token generated", extra={"user": login})
        schema = UserSetPasswordTokenResponseSchema()
        return schema.dump({"login": login, "token": token})


class UserResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def get(self, login):
        """
        ---
        summary: Get user information
        description: |
            Returns information about user.

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
        responses:
            200:
                description: User information
                content:
                  application/json:
                    schema: UserItemResponseSchema
            403:
                description: When user doesn't have `manage_users` capability.
            404:
                description: When user doesn't exist.
        """
        obj = db.session.query(User).filter(User.login == login).first()
        if obj is None:
            raise NotFound("No such user")
        schema = UserItemResponseSchema()
        return schema.dump(obj)

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def post(self, login):
        """
        ---
        summary: Create a new user
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
                schema: UserCreateRequestSchema
        responses:
            200:
                description: When user was created successfully
                content:
                  application/json:
                    schema: UserSuccessResponseSchema
            400:
                description: When request body is invalid
            403:
                description: When user doesn't have `manage_users` capability.
            409:
                description: When user or group with provided name already exists.
            500:
                description: |
                    When SMTP server is unavailable or not properly configured
                    on the server.
        """
        schema = UserCreateRequestSchema()

        obj = loads_schema(request.get_data(as_text=True), schema)

        user_login_obj = load_schema({"login": login}, UserLoginSchemaBase())

        if db.session.query(
            exists().where(User.login == user_login_obj["login"])
        ).scalar():
            raise Conflict("User exists yet")

        if db.session.query(
            exists().where(Group.name == user_login_obj["login"])
        ).scalar():
            raise Conflict("Group exists yet")

        user = User.create(
            user_login_obj["login"],
            obj["email"],
            obj["additional_info"],
            pending=False,
            feed_quality=obj["feed_quality"],
        )

        if obj["send_email"]:
            try:
                send_email_notification(
                    "register",
                    "New account registered in MWDB",
                    user.email,
                    base_url=app_config.mwdb.base_url,
                    login=user.login,
                    set_password_token=user.generate_set_password_token().decode(
                        "utf-8"
                    ),
                )
            except MailError:
                logger.exception("Can't send e-mail notification")
                raise InternalServerError(
                    "SMTP server needed to fulfill this request is"
                    " not configured or unavailable."
                )

        db.session.commit()

        logger.info("User created", extra={"user": user.login})
        schema = UserSuccessResponseSchema()
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
                schema: UserUpdateRequestSchema
        responses:
            200:
                description: When user was updated successfully
                content:
                  application/json:
                    schema: UserSuccessResponseSchema
            400:
                description: When request body is invalid
            403:
                description: |
                    When user doesn't have `manage_users` capability
                    or modified user is pending.
            404:
                description: When user doesn't exist.
        """
        schema = UserUpdateRequestSchema()

        obj = loads_schema(request.get_data(as_text=True), schema)

        user_login_obj = load_schema({"login": login}, UserLoginSchemaBase())

        user = (
            db.session.query(User).filter(User.login == user_login_obj["login"]).first()
        )
        if user is None:
            raise NotFound("No such user")

        if user.pending:
            raise Forbidden("User is pending and need to be accepted first")

        email = obj["email"]
        if email is not None:
            user.email = email

        additional_info = obj["additional_info"]
        if additional_info is not None:
            user.additional_info = additional_info

        feed_quality = obj["feed_quality"]
        if feed_quality is not None:
            user.feed_quality = feed_quality

        disabled = obj["disabled"]
        if disabled is not None:
            if user.id == g.auth_user.id:
                raise Forbidden("You can't block yourself.")
            user.disabled = disabled
            user.reset_sessions()

        db.session.commit()
        logger.info("User updated", extra=obj)

        schema = UserSuccessResponseSchema()
        return schema.dump({"login": user_login_obj["login"]})

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def delete(self, login):
        """
        ---
        summary: Delete user
        description: |
            Remove user from database.

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
        responses:
            200:
                description: When user was removed successfully
                content:
                  application/json:
                    schema: UserSuccessResponseSchema
            403:
                description: When user doesn't have `manage_users` capability.
            404:
                description: When user doesn't exist.
        """
        if g.auth_user.login == login:
            raise Forbidden("You can't remove yourself from the database.")
        user = db.session.query(User).filter(User.login == login).first()

        if user is None:
            raise NotFound("No such user")

        group = (db.session.query(Group).filter(Group.name == login)).first()

        db.session.delete(user)
        db.session.delete(group)
        db.session.commit()

        logger.info("User was deleted", extra={"user": login})

        schema = UserSuccessResponseSchema()
        return schema.dump({"login": login})


class UserProfileResource(Resource):
    @requires_authorization
    def get(self, login):
        """
        ---
        summary: Get profile information
        description: |
            Returns information about specific user
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
                description: Returns information about specific user
                content:
                  application/json:
                    schema: UserProfileResponseSchema
            404:
                description: When user doesn't exist or is not a member of user's group
        """
        user_login_obj = load_schema({"login": login}, UserLoginSchemaBase())

        if g.auth_user.has_rights(Capabilities.manage_users):
            user = (
                db.session.query(User)
                .filter(User.login == user_login_obj["login"])
                .first()
            )
        else:
            user = (
                db.session.query(User)
                .join(User.memberships)
                .join(Member.group)
                .filter(Group.name != "public")
                .filter(g.auth_user.is_member(Group.id))
                .filter(User.login == user_login_obj["login"])
            ).first()
        if user is None:
            raise NotFound("User doesn't exist or is not a member of your group")

        if g.auth_user.login == user_login_obj["login"]:
            schema = UserOwnProfileResponseSchema()
        else:
            schema = UserProfileResponseSchema()
        return schema.dump(user)
