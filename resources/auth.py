import datetime
import requests

from flask import request, g, current_app
from flask_restful import Resource
from sqlalchemy import exists
from sqlalchemy.orm.exc import NoResultFound
from werkzeug.exceptions import Forbidden, Conflict, InternalServerError

from model import db, User, Group
from core.capabilities import Capabilities
from core.mail import MailError, send_email_notification
from core.schema import UserLoginSchema, UserLoginSuccessSchema, UserTokenSchema, UserSetPasswordSchema, \
    UserSuccessSchema, UserRegisterSchema, UserIdentitySchema
from core.util import is_maintenance_set, is_registration_enabled, get_base_url

from . import logger, requires_capabilities, requires_authorization


class LoginResource(Resource):
    def post(self):
        """
        ---
        description: Exchange user credentials for authorization token
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
        """
        schema = UserLoginSchema()
        obj = schema.loads(request.get_data(as_text=True))

        if obj.errors:
            return {"errors": obj.errors}, 400

        try:
            user = User.query.filter(User.login == obj.data.get('login')).one()
        except NoResultFound:
            raise Forbidden('Invalid login or password.')

        if is_maintenance_set() and user.login != "admin":
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
        description: Request new user account
        tags:
            - auth
        requestBody:
            description: User basic information
            content:
              application/json:
                schema: UserRegisterSchema
        responses:
            200:
                description: User login on successful registration
                content:
                  application/json:
                    schema: UserSuccessSchema
        """
        if not is_registration_enabled():
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

        recaptcha_secret = current_app.config.get("RECAPTCHA_SECRET")

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
                                    base_url=get_base_url(),
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
        description: Retrieve token for password change
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
                  type: object
                  schema:
                    $ref: '#/components/schemas/UserTokenSchema'
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
        description: Set password via authorization token
        tags:
            - auth
        requestBody:
            description: User auth token and new password
            content:
              application/json:
                schema: UserSetPasswordSchema
        responses:
            200:
              description: User login on successful password set
              content:
                application/json:
                  schema: UserSuccessSchema
        """
        schema = UserSetPasswordSchema()
        obj = schema.loads(request.get_data(as_text=True))
        if obj.errors:
            return {"errors": obj.errors}, 400
        user = User.verify_set_password_token(obj.data.get("token"))
        if user is None:
            raise Forbidden("Set password token expired")
        user.set_password(obj.data.get("password"))
        db.session.add(user)
        db.session.commit()
        schema = UserSuccessSchema()
        logger.info('change password', extra={'user': user.login})
        return schema.dump({"login": user.login})


class RefreshTokenResource(Resource):
    @requires_authorization
    def post(self):
        """
        ---
        description: Generates new token for session continuation
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
        description: Validates token for session
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
