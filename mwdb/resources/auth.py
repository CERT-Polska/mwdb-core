import datetime

import requests
from flask import g, request
from flask_restful import Resource
from sqlalchemy import exists, func
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql.expression import false
from werkzeug.exceptions import Conflict, Forbidden, InternalServerError

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.core.mail import MailError, send_email_notification
from mwdb.model import Group, Member, User, db
from mwdb.schema.auth import (
    AuthLoginRequestSchema,
    AuthRecoverPasswordRequestSchema,
    AuthRegisterRequestSchema,
    AuthSetPasswordRequestSchema,
    AuthSuccessResponseSchema,
    AuthValidateTokenResponseSchema,
)
from mwdb.schema.group import GroupListResponseSchema
from mwdb.schema.user import UserSuccessResponseSchema

from . import loads_schema, logger, requires_authorization, requires_capabilities


def verify_recaptcha(recaptcha_token):
    recaptcha_secret = app_config.mwdb.recaptcha_secret

    if recaptcha_secret:
        try:
            recaptcha_response = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={"secret": recaptcha_secret, "response": recaptcha_token},
            )
            recaptcha_response.raise_for_status()
        except Exception as e:
            logger.exception("Temporary problem with ReCAPTCHA.")
            raise InternalServerError("Temporary problem with ReCAPTCHA.") from e

        if not recaptcha_response.json().get("success"):
            raise Forbidden("Wrong ReCAPTCHA, please try again.")


class LoginResource(Resource):
    def post(self):
        """
        ---
        summary: Authenticate user
        description: |
            Authenticates user and returns authorization token
            and information about user capabilities.

            Token expires after 24 hours.
        tags:
            - auth
        requestBody:
            description: User credentials
            content:
              application/json:
                schema: AuthLoginRequestSchema
        responses:
            200:
              description: Authorization token with information about user capabilities
              content:
                application/json:
                  schema: AuthSuccessResponseSchema
            400:
              description: When request body is invalid
            403:
              description: |
                When credentials are invalid, account is inactive
                or system is set into maintenance mode.
        """
        schema = AuthLoginRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        try:
            user = User.query.filter(User.login == obj["login"]).one()
        except NoResultFound:
            raise Forbidden("Invalid login or password.")

        if (
            app_config.mwdb.enable_maintenance
            and user.login != app_config.mwdb.admin_login
        ):
            raise Forbidden("Maintenance underway. Please come back later.")

        if not user.verify_password(obj["password"]):
            raise Forbidden("Invalid login or password.")

        if user.pending:
            raise Forbidden(
                "User registration is pending - "
                "check your e-mail inbox for confirmation"
            )

        if user.disabled:
            raise Forbidden("User account is disabled.")

        user.logged_on = datetime.datetime.now()
        db.session.commit()

        auth_token = user.generate_session_token()

        logger.info("User logged in", extra={"login": user.login})
        schema = AuthSuccessResponseSchema()
        return schema.dump(
            {
                "login": user.login,
                "token": auth_token,
                "capabilities": user.capabilities,
                "groups": user.group_names,
            }
        )


class RegisterResource(Resource):
    def post(self):
        """
        ---
        summary: Request a new user account
        description: Creates a new pending user account.
        tags:
            - auth
        requestBody:
            description: User basic information
            content:
              application/json:
                schema: AuthRegisterRequestSchema
        responses:
            200:
                description: User login on successful registration.
                content:
                  application/json:
                    schema: UserSuccessResponseSchema
            400:
                description: When request body is invalid.
            403:
                description: |
                    When registration feature is disabled
                    or reCAPTCHA token wasn't valid.
            409:
                description: When user login or group name already exists.
            500:
                description: When ReCAPTCHA verification service is unavailable.
        """
        if not app_config.mwdb.enable_registration:
            raise Forbidden("User registration is not enabled.")

        schema = AuthRegisterRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        login = obj["login"]

        if db.session.query(exists().where(User.login == login)).scalar():
            raise Conflict("Name already exists")

        if db.session.query(exists().where(Group.name == login)).scalar():
            raise Conflict("Name already exists")

        verify_recaptcha(obj.get("recaptcha"))

        user = User.create(login, obj["email"], obj["additional_info"], pending=True)

        try:
            send_email_notification(
                "pending",
                "Pending registration in MWDB",
                user.email,
                base_url=app_config.mwdb.base_url,
                login=user.login,
            )
        except MailError:
            logger.exception("Can't send e-mail notification")

        logger.info("User registered", extra={"user": user.login})
        schema = UserSuccessResponseSchema()
        return schema.dump({"login": user.login})


class ChangePasswordResource(Resource):
    def post(self):
        """
        ---
        summary: Set a new password for user
        description: Sets a new password for user using password change token.
        tags:
            - auth
        requestBody:
            description: |
                User set password token and new password.

                Password must be longer than 8 chars
                and shorter than 72 UTF-8 encoded bytes.
            content:
              application/json:
                schema: AuthSetPasswordRequestSchema
        responses:
            200:
              description: User login on successful password set
              content:
                application/json:
                  schema: UserSuccessResponseSchema
            400:
                description: |
                    When request body is invalid or provided password
                    doesn't match the policy
            403:
                description: When set password token is no longer valid
        """
        schema = AuthSetPasswordRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        user = User.verify_set_password_token(obj["token"])
        if user is None:
            raise Forbidden("Set password token expired")

        user.set_password(password=obj["password"])
        db.session.commit()

        logger.info("Password changed", extra={"user": user.login})
        schema = UserSuccessResponseSchema()
        return schema.dump({"login": user.login})


class RequestPasswordChangeResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_profile)
    def post(self):
        """
        ---
        summary: Get password change link for the current user
        description: |
            Requests password change link for currently authenticated user.

            Link expires after setting a new password or after 14 days.

            Link is sent to the e-mail address set in user's profile.

            Requires `manage_profile` capability.
        security:
            - bearerAuth: []
        tags:
            - auth
        responses:
            200:
              description: |
                When password change link was successfully sent to the user's e-mail
              content:
                application/json:
                  schema: UserSuccessResponseSchema
            403:
              description: |
                When user doesn't have required capability
            500:
              description: |
                When SMTP server is unavailable or not properly configured
                on the server.
        """
        login = g.auth_user.login
        email = g.auth_user.email

        try:
            send_email_notification(
                "recover",
                "Change password in MWDB",
                email,
                base_url=app_config.mwdb.base_url,
                login=login,
                set_password_token=g.auth_user.generate_set_password_token().decode(
                    "utf-8"
                ),
            )
        except MailError:
            logger.exception("Can't send e-mail notification")
            raise InternalServerError(
                "SMTP server needed to fulfill this request is"
                " not configured or unavailable."
            )

        schema = UserSuccessResponseSchema()
        logger.info("Requested password change token", extra={"user": login})
        return schema.dump({"login": login})


class RecoverPasswordResource(Resource):
    def post(self):
        """
        ---
        summary: Recover user password
        description: |
            Sends e-mail with password recovery link for provided login and e-mail.

            Link expires after setting a new password or after 14 days.

            Link is sent to the e-mail address set in user's profile.

            User must have `manage_profile` capability.
        requestBody:
            description: |
                User login and e-mail
            content:
              application/json:
                schema: AuthRecoverPasswordRequestSchema
        tags:
            - auth
        responses:
            200:
                description: Get the password reset link by providing login and e-mail
                content:
                  application/json:
                    schema: UserSuccessResponseSchema
            400:
                description: When request body is invalid
            403:
                description: |
                    When login and e-mail address doesn't match or doesn't exist
            500:
                description: |
                    When SMTP server is unavailable or not properly configured
                    on the server.
        """
        schema = AuthRecoverPasswordRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        try:
            user = User.query.filter(
                User.login == obj["login"],
                func.lower(User.email) == obj["email"].lower(),
                User.pending == false(),
            ).one()
        except NoResultFound:
            raise Forbidden("Invalid login or email address.")

        if not user.has_rights(Capabilities.manage_profile):
            raise Forbidden(
                "You are not allowed to recover the password. "
                "Ask administrator for details."
            )

        verify_recaptcha(obj.get("recaptcha"))

        try:
            send_email_notification(
                "recover",
                "Recover password in MWDB",
                user.email,
                base_url=app_config.mwdb.base_url,
                login=user.login,
                set_password_token=user.generate_set_password_token().decode("utf-8"),
            )
        except MailError:
            logger.exception("Can't send e-mail notification")
            raise InternalServerError(
                "SMTP server needed to fulfill this request is"
                " not configured or unavailable."
            )

        logger.info("User password recovered", extra={"user": user.login})
        schema = UserSuccessResponseSchema()
        return schema.dump({"login": user.login})


class RefreshTokenResource(Resource):
    @requires_authorization
    def post(self):
        """
        ---
        summary: Refresh session
        description: Generates a new token for session continuation.
        security:
            - bearerAuth: []
        tags:
            - auth
        responses:
            200:
              description: |
                Regenerated authorization token with information
                about user capabilities
              content:
                application/json:
                  schema: AuthSuccessResponseSchema
        """
        user = g.auth_user

        user.logged_on = datetime.datetime.now()
        db.session.commit()

        logger.info("Session token refreshed", extra={"user": user.login})
        schema = AuthSuccessResponseSchema()
        return schema.dump(
            {
                "login": user.login,
                "token": user.generate_session_token(),
                "capabilities": user.capabilities,
                "groups": user.group_names,
            }
        )


class ValidateTokenResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: Get session information
        description: Validates token for session and returns session information.
        security:
            - bearerAuth: []
        tags:
            - auth
        responses:
            200:
                description: Information about user capabilities
                content:
                  application/json:
                    schema: AuthValidateTokenResponseSchema
        """
        user = g.auth_user

        logger.info("Token validated", extra={"user": user.login})
        schema = AuthValidateTokenResponseSchema()
        return schema.dump(
            {
                "login": user.login,
                "capabilities": user.capabilities,
                "groups": user.group_names,
            }
        )


class AuthGroupListResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: List of user groups
        description: |
            Returns list of user groups and members.
        security:
            - bearerAuth: []
        tags:
            - auth
        responses:
            200:
                description: List of user groups
                content:
                  application/json:
                    schema: GroupListResponseSchema
        """
        objs = (
            db.session.query(Group)
            .options(joinedload(Group.members, Member.user))
            .filter(g.auth_user.is_member(Group.id))
            .filter(Group.workspace.is_(True))
            .filter(Group.private.is_(False))
        ).all()

        schema = GroupListResponseSchema()
        return schema.dump({"groups": objs})
