import uuid

from datetime import datetime
from flask import g
from flask_restful import Resource
from sqlalchemy.orm.exc import NoResultFound
from werkzeug.exceptions import Forbidden, NotFound

from core.capabilities import Capabilities

from model import db
from model.api_key import APIKey
from model.user import User

from core.schema import APIKeyTokenSchema

from . import requires_authorization


class APIKeyIssueResource(Resource):
    @requires_authorization
    def post(self, login):
        """
        ---
        summary: Create new API key for user
        description: |
            Creates new API key and returns its id and token

            Requires 'manage_users' capability if login doesn't match the login of currently authenticated
            user.
        security:
            - bearerAuth: []
        tags:
            - api_key
        parameters:
            - in: path
              name: login
              schema:
                type: string
              description: Owner login for created API key
        responses:
            200:
                description: Identifier and token for created API key
                content:
                  application/json:
                    schema: APIKeyTokenSchema
            403:
                description: |
                    When user doesn't have required 'manage_users' capability or provided
                    login doesn't exist.
        """
        if not g.auth_user.has_rights(Capabilities.manage_users) and g.auth_user.login != login:
            raise Forbidden("You are not permitted to perform this action")

        try:
            api_key_owner = User.query.filter(User.login == login).one()
        except NoResultFound:
            raise Forbidden('User not found')

        api_key = APIKey()
        api_key.id = uuid.uuid4()
        api_key.user_id = api_key_owner.id
        api_key.issued_by = g.auth_user.id
        api_key.issued_on = datetime.now()

        db.session.add(api_key)
        db.session.commit()

        return APIKeyTokenSchema().dump({
            "id": str(api_key.id),
            "token": api_key.generate_token()
        })


class APIKeyResource(Resource):
    @requires_authorization
    def get(self, api_key_id):
        """
        ---
        summary: Get token for API key
        description: |
            Returns token for provided API key identifier

            Requires 'manage_users' capability if current user doesn't own the key.
        security:
            - bearerAuth: []
        tags:
            - api_key
        parameters:
            - in: path
              name: api_key_id
              schema:
                type: string
              description: API key identifier
        responses:
            200:
                description: Identifier and token for API key
                content:
                  application/json:
                    schema: APIKeyTokenSchema
            404:
                description: |
                    When API key doesn't exist or user doesn't own the key and
                    doesn't have the 'manage_users' capability.
        """
        try:
            api_key = APIKey.query.filter(APIKey.id == uuid.UUID(api_key_id)).one()
        except NoResultFound:
            raise NotFound("API key doesn't exist")

        if not g.auth_user.has_rights(Capabilities.manage_users) and g.auth_user.id != api_key.user_id:
            raise NotFound("API key doesn't exist")

        return APIKeyTokenSchema().dump({
            "id": str(api_key.id),
            "token": api_key.generate_token()
        })

    @requires_authorization
    def delete(self, api_key_id):
        """
        ---
        summary: Delete API key
        description: |
            Deletes API key with provided identifier

            Requires 'manage_users' capability if current user doesn't own the key.
        security:
            - bearerAuth: []
        tags:
            - api_key
        parameters:
            - in: path
              name: api_key_id
              schema:
                type: string
              description: API key identifier
        responses:
            200:
                description: When API key was successfully deleted
            404:
                description: |
                    When API key doesn't exist or user doesn't own the key and
                    doesn't have the 'manage_users' capability.
        """
        try:
            api_key = APIKey.query.filter(APIKey.id == uuid.UUID(api_key_id)).one()
        except NoResultFound:
            raise NotFound("API key doesn't exist")

        if not g.auth_user.has_rights(Capabilities.manage_users) and g.auth_user.id != api_key.user_id:
            raise NotFound("API key doesn't exist")

        db.session.delete(api_key)
        db.session.commit()
