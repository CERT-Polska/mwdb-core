import uuid
from datetime import datetime

from flask import g, request
from flask_restful import Resource
from sqlalchemy.orm.exc import NoResultFound
from werkzeug.exceptions import Forbidden, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.model import APIKey, User, db
from mwdb.schema.api_key import (
    APIKeyIdentifierBase,
    APIKeyIssueRequestSchema,
    APIKeyTokenResponseSchema,
)

from . import (
    load_schema,
    loads_schema,
    logger,
    requires_authorization,
    requires_capabilities,
)


class APIKeyIssueResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_profile)
    def post(self, login):
        """
        ---
        summary: Create a new API key for user
        description: |
            Creates a new API key and returns its id and token.

            Requires `manage_profile` capability.

            Requires `manage_users` capability if login doesn't match the login
            of currently authenticated user.
        security:
            - bearerAuth: []
        tags:
            - api_key
        parameters:
            - in: path
              name: login
              schema:
                type: string
              description: Owner login for the created API key
        requestBody:
            description: Name for the created API key
            content:
              application/json:
                schema: APIKeyIssueRequestSchema
        responses:
            200:
                description: Identifier and token for created API key
                content:
                  application/json:
                    schema: APIKeyTokenResponseSchema
            403:
                description: |
                    When user doesn't have required capability
            404:
                description: |
                    If provided login doesn't exist.
        """
        if (
            not g.auth_user.has_rights(Capabilities.manage_users)
            and g.auth_user.login != login
        ):
            raise Forbidden(
                "You don't have required capability "
                "(manage_users) to perform this action"
            )

        try:
            api_key_owner = User.query.filter(User.login == login).one()
        except NoResultFound:
            raise NotFound("User not found")

        data = request.get_data(as_text=True) or "{}"
        key_name = loads_schema(data, APIKeyIssueRequestSchema())["name"]

        api_key = APIKey(
            id=uuid.uuid4(),
            name=key_name,
            user_id=api_key_owner.id,
            issued_by=g.auth_user.id,
            issued_on=datetime.now(),
        )
        db.session.add(api_key)
        db.session.commit()

        logger.info("API key created", extra={"id": api_key.id})
        return APIKeyTokenResponseSchema().dump(
            {
                "id": api_key.id,
                "issued_on": api_key.issued_on,
                "issuer_login": api_key.issuer_login,
                "name": api_key.name,
                "token": api_key.generate_token(),
            }
        )


class APIKeyResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_profile)
    def get(self, api_key_id):
        """
        ---
        summary: Get token for API key
        description: |
            Returns token for provided API key identifier.

            Requires `manage_profile` capability.

            Requires `manage_users` capability if current user doesn't own the key.
        security:
            - bearerAuth: []
        tags:
            - api_key
        parameters:
            - in: path
              name: api_key_id
              schema:
                type: string
                format: uuid
              description: API key identifier
        responses:
            200:
                description: Identifier and token for API key
                content:
                  application/json:
                    schema: APIKeyTokenResponseSchema
            400:
                description: When API key identifier is not a correct UUID
            403:
                description: |
                    When user doesn't have required capability
            404:
                description: |
                    When API key doesn't exist or user doesn't own the key and
                    doesn't have the `manage_users` capability.
        """
        obj = load_schema({"id": api_key_id}, APIKeyIdentifierBase())

        try:
            api_key = APIKey.query.filter(APIKey.id == obj["id"]).one()
        except NoResultFound:
            raise NotFound("API key doesn't exist")

        if (
            not g.auth_user.has_rights(Capabilities.manage_users)
            and g.auth_user.id != api_key.user_id
        ):
            raise NotFound("API key doesn't exist")

        return APIKeyTokenResponseSchema().dump(
            {
                "id": api_key.id,
                "issued_on": api_key.issued_on,
                "issuer_login": api_key.issuer_login,
                "name": api_key.name,
                "token": api_key.generate_token(),
            }
        )

    @requires_authorization
    @requires_capabilities(Capabilities.manage_profile)
    def delete(self, api_key_id):
        """
        ---
        summary: Delete API key
        description: |
            Deletes API key with provided identifier.

            Requires `manage_profile` capability.

            Requires `manage_users` capability if current user doesn't own the key.
        security:
            - bearerAuth: []
        tags:
            - api_key
        parameters:
            - in: path
              name: api_key_id
              schema:
                type: string
                format: uuid
              description: API key identifier
        responses:
            200:
                description: When API key was successfully deleted
            400:
                description: When API key identifier is not a correct UUID
            403:
                description: |
                    When user doesn't have required capability
            404:
                description: |
                    When API key doesn't exist or user doesn't own the key and
                    doesn't have the `manage_users` capability.
        """
        obj = load_schema({"id": api_key_id}, APIKeyIdentifierBase())

        try:
            api_key = APIKey.query.filter(APIKey.id == obj["id"]).one()
        except NoResultFound:
            raise NotFound("API key doesn't exist")

        if (
            not g.auth_user.has_rights(Capabilities.manage_users)
            and g.auth_user.id != api_key.user_id
        ):
            raise NotFound("API key doesn't exist")

        db.session.delete(api_key)
        db.session.commit()
        logger.info("API key deleted", extra={"id": api_key.id})
