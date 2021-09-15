import datetime

from flask import g, request
from flask_restful import Resource
from werkzeug.exceptions import Forbidden, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.model import OpenIDProvider, OpenIDUserIdentity, db
from mwdb.schema.auth import AuthSuccessResponseSchema
from mwdb.schema.oauth import (
    OpenIDAuthorizeRequestSchema,
    OpenIDLoginResponseSchema,
    OpenIDProviderCreateRequestSchema,
    OpenIDProviderListResponseSchema,
)

from . import loads_schema, logger, requires_authorization, requires_capabilities


class OpenIDProviderResource(Resource):
    def get(self):
        """
        ---
        summary: List OpenID Connect providers
        description: |
            TODO
        tags:
            - auth
        responses:
            200:
                description: Returns list of registered OIDC Providers
                content:
                  application/json:
                    schema: OpenIDProviderListResponseSchema
        """
        providers = [
            name
            for name, *_ in db.session.query(OpenIDProvider.name)
            .order_by(OpenIDProvider.id.asc())
            .all()
        ]
        return OpenIDProviderListResponseSchema().dump({"providers": providers})

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def post(self):
        """
        ---
        summary: Register new OIDC provider
        description: |
            TODO
        security:
            - bearerAuth: []
        tags:
            - auth
        requestBody:
            description: OpenID Connect configuration
            content:
              application/json:
                schema: OpenIDProviderCreateRequestSchema
        responses:
            200:
                description: When provider is successfully added
        """
        schema = OpenIDProviderCreateRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        provider = OpenIDProvider(
            name=obj["name"],
            client_id=obj["client_id"],
            client_secret=obj["client_secret"],
            authorization_endpoint="http://127.0.0.1:5000/oauth/authorize",
            token_endpoint="http://oidc-server:5000/oauth/token",
            userinfo_endpoint="http://oidc-server:5000/userinfo",
        )
        db.session.add(provider)
        db.session.commit()


class OpenIDAuthenticateResource(Resource):
    def post(self, provider_name):
        """
        ---
        summary: Login using OpenID Connect
        description: |
            TODO
        tags:
            - auth
        parameters:
            - in: path
              name: provider_name
              schema:
                type: string
              description: OpenID provider name.
        responses:
            200:
                description: Returns authorization URL for chosen provider
                content:
                  application/json:
                    schema: OpenIDLoginResponseSchema
        """
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        redirect_uri = f"{app_config.mwdb.base_url}/oauth/authorize"
        url, state, nonce = provider.create_authorization_url(redirect_uri)

        schema = OpenIDLoginResponseSchema()
        return schema.dump({"authorization_url": url, "state": state, "nonce": nonce})


class OpenIDAuthorizeResource(Resource):
    def post(self, provider_name):
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        schema = OpenIDAuthorizeRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)
        redirect_uri = f"{app_config.mwdb.base_url}/oauth/authorize"
        userinfo = provider.fetch_id_token(
            obj["code"], obj["state"], obj["nonce"], redirect_uri
        )
        # 'sub' bind should be used instead of 'name'
        identity = (
            db.session.query(OpenIDUserIdentity)
            .filter(
                OpenIDUserIdentity.sub_id == userinfo["sub"],
                OpenIDUserIdentity.provider_id == provider.id,
            )
            .first()
        )
        if identity is None:
            raise Forbidden("Unknown identity")

        user = identity.user

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

        logger.info(
            "User logged in via OpenID Provider",
            extra={"login": user.login, "provider": provider_name},
        )
        schema = AuthSuccessResponseSchema()
        return schema.dump(
            {
                "login": user.login,
                "token": auth_token,
                "capabilities": user.capabilities,
                "groups": user.group_names,
            }
        )


class OpenIDBindAccountResource(Resource):
    @requires_authorization
    def post(self, provider_name):
        """
        ---
        summary: Bind existing mwdb account with OpenID identity
        description: |
            TODO
        tags:
            - auth
        parameters:
            - in: path
              name: provider_name
              schema:
                type: string
              description: OpenID provider name.
        requestBody:
            description: OpenID Connect request state
            content:
              application/json:
                schema: OpenIDAuthorizeRequestSchema
        responses:
            200:
                description: When OpenID identity was successively bound to mwdb account
        """
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        schema = OpenIDAuthorizeRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)
        redirect_uri = f"{app_config.mwdb.base_url}/oauth/authorize"
        userinfo = provider.fetch_id_token(
            obj["code"], obj["state"], obj["nonce"], redirect_uri
        )
        identity = OpenIDUserIdentity(
            sub_id=userinfo["sub"], provider_id=provider.id, user_id=g.auth_user.id
        )
        db.session.add(identity)
        db.session.commit()

        logger.info(
            "Account was successfully bound with OpenID Identity",
            extra={"user": g.auth_user.login, "provider": provider.name},
        )


class OpenIDAccountIdentitiesResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: List OpenID bound external identities
        description: |
            TODO
        tags:
            - auth
        responses:
            200:
                description: Returns list of accounts OpenID bound identities
                content:
                  application/json:
                    schema: OpenIDProviderListResponseSchema
        """
        identities = [
            identity.provider.name for identity in g.auth_user.openid_identities
        ]
        return OpenIDProviderListResponseSchema().dump({"providers": identities})
