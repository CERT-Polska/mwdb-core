import datetime

from flask import g, request
from sqlalchemy import and_, exists, or_
from werkzeug.exceptions import Conflict, Forbidden, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.core.plugins import hooks
from mwdb.core.service import Resource
from mwdb.model import Group, OpenIDProviderSettings, OpenIDUserIdentity, db
from mwdb.schema.auth import AuthSuccessResponseSchema
from mwdb.schema.group import GroupNameSchemaBase
from mwdb.schema.oauth import (
    OpenIDAuthorizeRequestSchema,
    OpenIDLoginResponseSchema,
    OpenIDLogoutLinkResponseSchema,
    OpenIDProviderCreateRequestSchema,
    OpenIDProviderItemResponseSchema,
    OpenIDProviderListResponseSchema,
    OpenIDProviderSuccessResponseSchema,
    OpenIDProviderUpdateRequestSchema,
)

from . import (
    load_schema,
    loads_schema,
    logger,
    requires_authorization,
    requires_capabilities,
)


class OpenIDProviderResource(Resource):
    def get(self):
        """
        ---
        summary: List OpenID Connect providers
        description: |
            List registered OpenID Connect providers
        tags:
            - auth
        responses:
            200:
                description: Returns list of registered OIDC Providers
                content:
                  application/json:
                    schema: OpenIDProviderListResponseSchema
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        providers = [
            name
            for name, *_ in db.session.query(OpenIDProviderSettings.name)
            .order_by(OpenIDProviderSettings.id.asc())
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
            Register new OpenID Connect provider
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
            409:
                description: |
                    This OIDC provider is already registered.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        schema = OpenIDProviderCreateRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        client_secret = None
        if obj["client_secret"]:
            client_secret = obj["client_secret"]

        jwks_endpoint = None
        if obj["jwks_endpoint"]:
            jwks_endpoint = obj["jwks_endpoint"]

        logout_endpoint = None
        if obj["logout_endpoint"]:
            logout_endpoint = obj["logout_endpoint"]

        if db.session.query(
            exists().where(and_(OpenIDProviderSettings.name == obj["name"]))
        ).scalar():
            raise Conflict(
                "The identity provider is already registered with the given name"
            )

        provider_settings = OpenIDProviderSettings(
            name=obj["name"],
            client_id=obj["client_id"],
            client_secret=client_secret,
            authorization_endpoint=obj["authorization_endpoint"],
            token_endpoint=obj["token_endpoint"],
            userinfo_endpoint=obj["userinfo_endpoint"],
            jwks_endpoint=jwks_endpoint,
            logout_endpoint=logout_endpoint,
        )

        provider = provider_settings.get_oidc_provider()
        group_name = provider.get_group_name()
        group_name_obj = load_schema({"name": group_name}, GroupNameSchemaBase())

        if db.session.query(
            exists().where(Group.name == group_name_obj["name"])
        ).scalar():
            raise Conflict("Group exists yet, choose another provider name")

        group = provider.create_provider_group()
        db.session.add(group)
        db.session.flush()
        db.session.refresh(group)

        provider_settings.group_id = group.id
        db.session.add(provider_settings)
        db.session.commit()
        hooks.on_created_group(group)


class OpenIDSingleProviderResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def get(self, provider_name):
        """
        ---
        summary: Get provider information
        description: |
            Get registered OIDC provider information.
        security:
            - bearerAuth: []
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
                description: Information about registered provider
                content:
                  application/json:
                    schema: OpenIDProviderItemResponseSchema
            403:
                description: When user doesn't have `manage_users` capability.
            404:
                description: Requested provider doesn't exist
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        provider_settings = (
            db.session.query(OpenIDProviderSettings)
            .filter(OpenIDProviderSettings.name == provider_name)
            .first()
        )
        if not provider_settings:
            raise NotFound(f"Requested provider name '{provider_name}' not found")
        schema = OpenIDProviderItemResponseSchema()
        return schema.dump(provider_settings)

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def put(self, provider_name):
        """
        ---
        summary: Modify registered OIDC provider
        description: |
            Modify registered OIDC provider.
        security:
            - bearerAuth: []
        tags:
            - auth
        parameters:
            - in: path
              name: provider_name
              schema:
                type: string
              description: OpenID provider name.
        requestBody:
            description: OpenID Connect configuration
            content:
              application/json:
                schema: OpenIDProviderUpdateRequestSchema
        responses:
            200:
                description: When provider was updated successfully
                content:
                  application/json:
                    schema: OpenIDProviderSuccessResponseSchema
            403:
                description: When user doesn't have `manage_users` capability.
            404:
                description: Requested provider doesn't exist
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        schema = OpenIDProviderUpdateRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)
        provider_settings = (
            db.session.query(OpenIDProviderSettings)
            .filter(OpenIDProviderSettings.name == provider_name)
            .first()
        )
        if not provider_settings:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        client_id = obj["client_id"]
        if client_id is not None:
            provider_settings.client_id = client_id

        client_secret = obj["client_secret"]
        if client_secret is not None:
            provider_settings.client_secret = client_secret

        authorization_endpoint = obj["authorization_endpoint"]
        if authorization_endpoint is not None:
            provider_settings.authorization_endpoint = authorization_endpoint

        token_endpoint = obj["token_endpoint"]
        if token_endpoint is not None:
            provider_settings.token_endpoint = token_endpoint

        userinfo_endpoint = obj["userinfo_endpoint"]
        if userinfo_endpoint is not None:
            provider_settings.userinfo_endpoint = userinfo_endpoint

        jwks_endpoint = obj["jwks_endpoint"]
        if jwks_endpoint is not None:
            provider_settings.jwks_endpoint = jwks_endpoint

        logout_endpoint = obj["logout_endpoint"]
        if logout_endpoint is not None:
            provider_settings.logout_endpoint = logout_endpoint

        db.session.commit()

        logger.info("Provider updated", extra={"provider": provider_name})

        schema = OpenIDProviderSuccessResponseSchema()
        return schema.dump({"name": provider_settings.name})

    @requires_authorization
    @requires_capabilities(Capabilities.manage_users)
    def delete(self, provider_name):
        """
        ---
        summary: Delete registered OIDC provider
        description: |
            Remove registered OIDC provider form database.
        security:
            - bearerAuth: []
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
                description: When provider was removed successfully
                content:
                  application/json:
                    schema: OpenIDProviderSuccessResponseSchema
            403:
                description: When user doesn't have `manage_users` capability.
            404:
                description: When provider doesn't exist
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        provider_settings = (
            db.session.query(OpenIDProviderSettings)
            .filter(OpenIDProviderSettings.name == provider_name)
            .first()
        )
        if not provider_settings:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        provider_group_name = provider_settings.group.name
        db.session.delete(provider_settings)
        db.session.commit()

        hooks.on_removed_group(provider_group_name)
        logger.info("Provider was deleted", extra={"provider": provider_name})
        schema = OpenIDProviderSuccessResponseSchema()
        return schema.dump({"name": provider_name})


class OpenIDAuthenticateResource(Resource):
    def post(self, provider_name):
        """
        ---
        summary: Login using OpenID Connect
        description: |
            Authenticate with the use of specific OpenID Connect provider
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
            404:
                description: Requested provider doesn't exist
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        provider_settings = (
            db.session.query(OpenIDProviderSettings)
            .filter(OpenIDProviderSettings.name == provider_name)
            .first()
        )
        if not provider_settings:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        redirect_uri = f"{app_config.mwdb.base_url}/oauth/callback"
        provider = provider_settings.get_oidc_provider()
        oidc_client = provider.client
        url, state, nonce = oidc_client.create_authorization_url(redirect_uri)

        schema = OpenIDLoginResponseSchema()
        return schema.dump({"authorization_url": url, "state": state, "nonce": nonce})


class OpenIDAuthorizeResource(Resource):
    def post(self, provider_name):
        provider_settings = (
            db.session.query(OpenIDProviderSettings)
            .filter(OpenIDProviderSettings.name == provider_name)
            .first()
        )
        if not provider_settings:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        schema = OpenIDAuthorizeRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)
        redirect_uri = f"{app_config.mwdb.base_url}/oauth/callback"
        provider = provider_settings.get_oidc_provider()
        oidc_client = provider.client
        id_token_claims = oidc_client.fetch_id_token(
            obj["code"], obj["state"], obj["nonce"], redirect_uri
        )
        # 'sub' bind should be used instead of 'name'
        identity = (
            db.session.query(OpenIDUserIdentity)
            .filter(
                OpenIDUserIdentity.sub_id == id_token_claims["sub"],
                OpenIDUserIdentity.provider_id == provider_settings.id,
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

        auth_token = user.generate_session_token(provider=provider_name)

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
                "provider": provider_name,
            }
        )


class OpenIDRegisterUserResource(Resource):
    def post(self, provider_name):
        provider_settings = (
            db.session.query(OpenIDProviderSettings)
            .filter(OpenIDProviderSettings.name == provider_name)
            .first()
        )
        if not provider_settings:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        provider_group = provider_settings.group

        schema = OpenIDAuthorizeRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)
        redirect_uri = f"{app_config.mwdb.base_url}/oauth/callback"
        provider = provider_settings.get_oidc_provider()
        oidc_client = provider.client
        id_token_claims = oidc_client.fetch_id_token(
            obj["code"], obj["state"], obj["nonce"], redirect_uri
        )
        # register user with information from provider
        if db.session.query(
            exists().where(
                and_(
                    OpenIDUserIdentity.provider_id == provider_settings.id,
                    OpenIDUserIdentity.sub_id == id_token_claims["sub"],
                )
            )
        ).scalar():
            raise Conflict("User is already bound with selected provider.")

        userinfo = oidc_client.userinfo()
        user = provider.create_user(id_token_claims["sub"], userinfo)
        identity = OpenIDUserIdentity(
            sub_id=id_token_claims["sub"],
            provider_id=provider_settings.id,
            user_id=user.id,
        )

        if not provider_group.add_member(user):
            raise Conflict("Member is already added")

        db.session.add(identity)

        user.logged_on = datetime.datetime.now()
        db.session.commit()

        auth_token = user.generate_session_token(provider=provider_name)

        user_private_group = next(
            (g for g in user.groups if g.name == user.login), None
        )
        hooks.on_created_user(user)
        if user_private_group:
            hooks.on_created_group(user_private_group)
        hooks.on_created_membership(provider_group, user)
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
                "provider": provider_name,
            }
        )


class OpenIDBindAccountResource(Resource):
    @requires_authorization
    def post(self, provider_name):
        """
        ---
        summary: Bind mwdb account with OpenID provider
        description: |
            Bind authenticated mwdb account with an expernat OpenID provider
        security:
            - bearerAuth: []
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
            404:
                description: Requested provider doesn't exist
            409:
                description: When Provider identity is already bound with mwdb account
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        provider_settings = (
            db.session.query(OpenIDProviderSettings)
            .filter(OpenIDProviderSettings.name == provider_name)
            .first()
        )
        if not provider_settings:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        provider_group = provider_settings.group

        schema = OpenIDAuthorizeRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)
        redirect_uri = f"{app_config.mwdb.base_url}/oauth/callback"
        provider = provider_settings.get_oidc_provider()
        oidc_client = provider.client
        id_token_claims = oidc_client.fetch_id_token(
            obj["code"], obj["state"], obj["nonce"], redirect_uri
        )
        if db.session.query(
            exists().where(
                and_(
                    OpenIDUserIdentity.provider_id == provider_settings.id,
                    or_(
                        OpenIDUserIdentity.user_id == g.auth_user.id,
                        OpenIDUserIdentity.sub_id == id_token_claims["sub"],
                    ),
                )
            )
        ).scalar():
            raise Conflict("Provider identity is already bound with mwdb account.")

        identity = OpenIDUserIdentity(
            sub_id=id_token_claims["sub"],
            provider_id=provider_settings.id,
            user_id=g.auth_user.id,
        )

        if not provider_group.add_member(g.auth_user):
            raise Conflict("Member is already added")

        db.session.add(identity)

        db.session.commit()

        hooks.on_created_membership(provider_group, g.auth_user)

        logger.info(
            "Account was successfully bound with OpenID Identity",
            extra={"user": g.auth_user.login, "provider": provider_settings.name},
        )


class OpenIDAccountIdentitiesResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: List OpenID bound external identities
        description: |
            List of related identities to authenticated mwdb account
        security:
            - bearerAuth: []
        tags:
            - auth
        responses:
            200:
                description: Returns list of accounts OpenID bound identities
                content:
                  application/json:
                    schema: OpenIDProviderListResponseSchema
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        identities = [
            identity.provider.name for identity in g.auth_user.openid_identities
        ]
        return OpenIDProviderListResponseSchema().dump({"providers": identities})


class OpenIDLogoutResource(Resource):
    @requires_authorization
    def get(self, provider_name):
        """
        ---
        summary: Get logout endpoint url
        description: |
            Get logout endpoint url
        security:
            - bearerAuth: []
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
                description: When logout endpoint was found
                content:
                  application/json:
                    schema: OpenIDLogoutLinkResponseSchema
            404:
                description: |
                    Requested provider doesn't exist or logout endpoint
                    is not specified for this provider
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        provider_settings = (
            db.session.query(OpenIDProviderSettings)
            .filter(OpenIDProviderSettings.name == provider_name)
            .first()
        )
        if not provider_settings:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        if not provider_settings.logout_endpoint:
            raise NotFound(f"Logout endpoint is not configured for '{provider_name}'")

        schema = OpenIDLogoutLinkResponseSchema()
        return schema.dump({"url": provider_settings.logout_endpoint})
