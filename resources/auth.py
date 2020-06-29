import datetime
import requests

from flask import request, g
from flask_restful import Resource
from sqlalchemy import exists
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql.expression import false
from werkzeug.exceptions import Forbidden, Conflict, InternalServerError, BadRequest

from model import db, User, Group
from core.capabilities import Capabilities
from core.config import app_config
from core.mail import MailError, send_email_notification
from core.schema import UserLoginSchema, UserLoginSuccessSchema, UserTokenSchema, UserSetPasswordSchema, \
    UserSuccessSchema, UserRegisterSchema, UserIdentitySchema, UserRecoverPasswordSchema

from . import logger, requires_capabilities, requires_authorization


class LoginResource(Resource):
    def post(self):
        """
        ---
        summary: Authenticate user
        description: |
            Authenticates user and returns authorization token and information about user capabilities.

            Token expires after 24 hours.
        tags:
            - auth
        requestBody:
            description: User credentials
            content:
              application/json:
                schema: UserLoginSchema
        responses:
            200:
              description: Authorization token with information about user capabilities
              content:
                application/json:
                  schema: UserLoginSuccessSchema
            400:
              description: When request body is invalid
            403:
              description: When credentials are invalid, account is inactive or system is set into maintenance mode.
        """
        schema = UserLoginSchema()
        obj = schema.loads(request.get_data(as_text=True))

        if obj.errors:
            return {"errors": obj.errors}, 400

        try:
            user = User.query.filter(User.login == obj.data.get('login')).one()
        except NoResultFound:
            raise Forbidden('Invalid login or password.')

        if app_config.malwarecage.enable_maintenance and user.login != app_config.malwarecage.admin_login:
            raise Forbidden('Maintenance underway. Please come back later.')

        if not user.verify_password(obj.data.get('password')):
            raise Forbidden('Invalid login or password.')

        if user.pending:
            raise Forbidden('User registration is pending - check your e-mail inbox for confirmation')

        if user.disabled:
            raise Forbidden('User account is disabled.')

        user.logged_on = datetime.datetime.now()
        db.session.add(user)
        db.session.commit()

        user_token = UserLoginSuccessSchema()
        auth_token = user.generate_session_token()
        return user_token.dump({"login": user.login,
                                "token": auth_token,
                                "capabilities": user.capabilities,
                                "groups": user.group_names})


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
                schema: UserRegisterSchema
        responses:
            200:
                description: User login on successful registration.
                content:
                  application/json:
                    schema: UserSuccessSchema
            400:
                description: When request body is invalid.
            403:
                description: When registration feature is disabled or reCAPTCHA token wasn't valid.
            409:
                description: When user login or group name already exists.
            500:
                description: When ReCAPTCHA verification service is unavailable.
        """
        if not app_config.malwarecage.enable_registration:
            raise Forbidden("User registration is not enabled.")

        schema = UserRegisterSchema()
        obj = schema.loads(request.get_data(as_text=True))

        if obj.errors:
            return {"errors": obj.errors}, 400

        login = obj.data.get("login")

        if db.session.query(exists().where(User.login == login)).scalar():
            raise Conflict("Name already exists")

        if db.session.query(exists().where(Group.name == login)).scalar():
            raise Conflict("Name already exists")

        recaptcha_secret = app_config.malwarecage.recaptcha_secret

        if recaptcha_secret:
            try:
                recaptcha_token = obj.data.get("recaptcha")
                recaptcha_response = requests.post(
                    'https://www.google.com/recaptcha/api/siteverify',
                    data={'secret': recaptcha_secret,
                          'response': recaptcha_token})
                recaptcha_response.raise_for_status()
            except Exception as e:
                logger.exception("Temporary problem with ReCAPTCHA.")
                raise InternalServerError("Temporary problem with ReCAPTCHA.") from e

            if not recaptcha_response.json().get('success'):
                raise Forbidden("Wrong ReCAPTCHA, please try again.")

        user = User()
        user.login = login
        user.email = obj.data.get("email")
        user.additional_info = obj.data.get("additional_info")
        user.pending = True
        user.disabled = False
        user.requested_on = datetime.datetime.now()
        user.groups.append(Group.public_group())
        user.reset_sessions()
        db.session.add(user)

        group = Group()
        group.name = login
        group.private = True
        group.users.append(user)
        db.session.add(group)
        db.session.commit()

        try:
            send_email_notification("pending",
                                    "Pending registration in Malwarecage",
                                    user.email,
                                    base_url=app_config.malwarecage.base_url,
                                    login=user.login)
        except MailError:
            logger.exception("Can't send e-mail notification")

        logger.info('User registered', extra={'user': user.login})
        schema = UserSuccessSchema()
        return schema.dump({"login": user.login})


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
            - auth
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
                  schema: UserTokenSchema
            403:
                description: When specified user doesn't exist
        """
        try:
            user = User.query.filter(User.login == login).one()
        except NoResultFound:
            raise Forbidden("User doesn't exist")

        token = user.generate_set_password_token()
        schema = UserTokenSchema()
        return schema.dump({"login": login, "token": token})


class UserChangePasswordResource(Resource):
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

                Password must be longer than 8 chars.
            content:
              application/json:
                schema: UserSetPasswordSchema
        responses:
            200:
              description: User login on successful password set
              content:
                application/json:
                  schema: UserSuccessSchema
            400:
                description: When request body is invalid or provided password doesn't match the policy
            403:
                description: When set password token is no longer valid
        """
        MIN_PASSWORD_LENGTH = 8
        MAX_PASSWORD_LENGHT = 72 #UTF-8 bytes
        schema = UserSetPasswordSchema()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400
        user = User.verify_set_password_token(obj.data.get("token"))
        if user is None:
            raise Forbidden("Set password token expired")
        password = obj.data.get("password")
        if password == "":
            raise BadRequest("Empty password is not allowed")
        if len(password) < MIN_PASSWORD_LENGTH:
            raise BadRequest("Password is too short")
        if len(password.encode()) > MAX_PASSWORD_LENGHT:
            raise BadRequest("The password should contain 72 bytes of UTF-8 characters, your password is too long.")

        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        schema = UserSuccessSchema()
        logger.info('change password', extra={'user': user.login})
        return schema.dump({"login": user.login})


class RequestPasswordChangeResource(Resource):
    @requires_authorization
    def post(self):
        """
        ---
        summary: Get password change link for the current user
        description: |
            Requests password change link for currently authenticated user.

            Link expires after setting a new password or after 14 days.

            Link is sent to the e-mail address set in user's profile.
        security:
            - bearerAuth: []
        tags:
            - auth
        responses:
            200:
              description: When password change link was successfully sent to the user's e-mail
              content:
                application/json:
                  schema: UserSuccessSchema
            500:
              description: When SMTP server is unavailable or not properly configured on the server.
        """
        login = g.auth_user.login
        email = g.auth_user.email

        try:
            send_email_notification("recover",
                                    "Change password in Malwarecage",
                                    email,
                                    base_url=app_config.malwarecage.base_url,
                                    login=login,
                                    set_password_token=g.auth_user.generate_set_password_token().decode("utf-8"))
        except MailError:
            logger.exception("Can't send e-mail notification")
            raise InternalServerError("SMTP server needed to fulfill this request is"
                                      " not configured or unavailable.")

        schema = UserSuccessSchema()
        logger.info('request change password', extra={'user': login})
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
        requestBody:
            description: |
                User login and e-mail
            content:
              application/json:
                schema: UserRecoverPasswordSchema
        tags:
            - auth
        responses:
            200:
                description: Get the password reset link by providing login and e-mail
                content:
                  application/json:
                    schema: UserRecoverPasswordSchema
            400:
                description: When request body is invalid
            403:
                description: When login and e-mail address doesn't match or doesn't exist
            500:
              description: When SMTP server is unavailable or not properly configured on the server.
        """
        schema = UserRecoverPasswordSchema()
        obj = schema.loads(request.get_data(as_text=True))

        if obj.errors:
            return {"errors": obj.errors}, 400

        try:
            user = User.query.filter(User.login == obj.data.get('login'), User.email == obj.data.get('email'), User.pending == false()).one()
        except NoResultFound:
            raise Forbidden('Invalid login or email address.')

        recaptcha_secret = app_config.malwarecage.recaptcha_secret

        if recaptcha_secret:
            try:
                recaptcha_token = obj.data.get("recaptcha")
                recaptcha_response = requests.post(
                    'https://www.google.com/recaptcha/api/siteverify',
                    data={'secret': recaptcha_secret,
                          'response': recaptcha_token})
                recaptcha_response.raise_for_status()
            except Exception as e:
                logger.exception("Temporary problem with ReCAPTCHA.")
                raise InternalServerError("Temporary problem with ReCAPTCHA.") from e

            if not recaptcha_response.json().get('success'):
                raise Forbidden("Wrong ReCAPTCHA, please try again.")

        try:
            send_email_notification("recover",
                                    "Recover password in Malwarecage",
                                    user.email,
                                    base_url=app_config.malwarecage.base_url,
                                    login=user.login,
                                    set_password_token=user.generate_set_password_token().decode("utf-8"))
        except MailError:
            logger.exception("Can't send e-mail notification")
            raise InternalServerError("SMTP server needed to fulfill this request is"
                                      " not configured or unavailable.")

        logger.info('User password recovered', extra={'user': user.login})
        return schema.dump({
            "login": user.login, 
            "email": user.email
        })


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
              description: Regenerated authorization token with information about user capabilities
              content:
                application/json:
                  schema: UserLoginSuccessSchema
        """
        user = g.auth_user
        schema = UserLoginSuccessSchema()

        user.logged_on = datetime.datetime.now()
        db.session.add(user)
        db.session.commit()

        logger.info('refresh token', extra={'user': user.login})
        return schema.dump({
            "login": user.login,
            "token": user.generate_session_token(),
            "capabilities": user.capabilities,
            "groups": user.group_names
        })


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
                    schema: UserIdentitySchema
        """
        user = g.auth_user
        schema = UserIdentitySchema()

        logger.info('validate token', extra={'user': user.login})
        return schema.dump({
            "login": user.login,
            "capabilities": user.capabilities,
            "groups": user.group_names
        })
