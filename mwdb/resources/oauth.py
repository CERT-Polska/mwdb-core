import datetime
import hashlib

from flask import g, request
from flask_restful import Resource
from marshmallow import ValidationError
from sqlalchemy import and_, exists, or_
from werkzeug.exceptions import Conflict, Forbidden, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.core.plugins import hooks
from mwdb.core.rate_limit import rate_limited_resource
from mwdb.model import Group, OpenIDProvider, OpenIDUserIdentity, User, db
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
from mwdb.schema.user import UserLoginSchemaBase

from . import (
    load_schema,
    loads_schema,
    logger,
    requires_authorization,
    requires_capabilities,
)


@rate_limited_resource
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
            exists().where(and_(OpenIDProvider.name == obj["name"]))
        ).scalar():
            raise Conflict(
                "The identity provider is already registered with the given name"
            )

        provider = OpenIDProvider(
            name=obj["name"],
            client_id=obj["client_id"],
            client_secret=client_secret,
            authorization_endpoint=obj["authorization_endpoint"],
            token_endpoint=obj["token_endpoint"],
            userinfo_endpoint=obj["userinfo_endpoint"],
            jwks_endpoint=jwks_endpoint,
            logout_endpoint=logout_endpoint,
        )

        group_name = ("OpenID_" + obj["name"])[:32]

        group_name_obj = load_schema({"name": group_name}, GroupNameSchemaBase())

        if db.session.query(
            exists().where(Group.name == group_name_obj["name"])
        ).scalar():
            raise Conflict("Group exists yet, choose another provider name")

        group = Group(name=group_name_obj["name"], immutable=True)

        db.session.add(group)
        db.session.add(provider)

        db.session.commit()
        hooks.on_created_group(group)


@rate_limited_resource
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
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")
        schema = OpenIDProviderItemResponseSchema()
        return schema.dump(provider)

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
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        client_id = obj["client_id"]
        if client_id is not None:
            provider.client_id = client_id

        client_secret = obj["client_secret"]
        if client_secret is not None:
            provider.client_secret = client_secret

        authorization_endpoint = obj["authorization_endpoint"]
        if authorization_endpoint is not None:
            provider.authorization_endpoint = authorization_endpoint

        token_endpoint = obj["token_endpoint"]
        if token_endpoint is not None:
            provider.token_endpoint = token_endpoint

        userinfo_endpoint = obj["userinfo_endpoint"]
        if userinfo_endpoint is not None:
            provider.userinfo_endpoint = userinfo_endpoint

        jwks_endpoint = obj["jwks_endpoint"]
        if jwks_endpoint is not None:
            provider.jwks_endpoint = jwks_endpoint

        logout_endpoint = obj["logout_endpoint"]
        if logout_endpoint is not None:
            provider.logout_endpoint = logout_endpoint

        db.session.commit()

        logger.info("Provider updated", extra={"provider": provider_name})

        schema = OpenIDProviderSuccessResponseSchema()
        return schema.dump({"name": provider.name})

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
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")
        group = provider.get_group()

        db.session.delete(provider)
        db.session.delete(group)
        db.session.commit()

        hooks.on_removed_group(("OpenID_" + provider_name)[:32])
        logger.info("Provider was deleted", extra={"provider": provider_name})
        schema = OpenIDProviderSuccessResponseSchema()
        return schema.dump({"name": provider_name})


@rate_limited_resource
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
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        redirect_uri = f"{app_config.mwdb.base_url}/oauth/callback"
        url, state, nonce = provider.create_authorization_url(redirect_uri)

        schema = OpenIDLoginResponseSchema()
        return schema.dump({"authorization_url": url, "state": state, "nonce": nonce})


@rate_limited_resource
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
        redirect_uri = f"{app_config.mwdb.base_url}/oauth/callback"
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


@rate_limited_resource
class OpenIDRegisterUserResource(Resource):
    def post(self, provider_name):
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        group = provider.get_group()

        schema = OpenIDAuthorizeRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)
        redirect_uri = f"{app_config.mwdb.base_url}/oauth/callback"
        userinfo = provider.fetch_id_token(
            obj["code"], obj["state"], obj["nonce"], redirect_uri
        )
        # register user with information from provider
        if db.session.query(
            exists().where(
                and_(
                    OpenIDUserIdentity.provider_id == provider.id,
                    OpenIDUserIdentity.sub_id == userinfo["sub"],
                )
            )
        ).scalar():
            raise Conflict("User is already bound with selected provider.")

        login_claims = ["preferred_username", "nickname", "name"]

        for claim in login_claims:
            username = userinfo.get(claim)
            if not username:
                continue
            try:
                UserLoginSchemaBase().load({"login": username})
            except ValidationError:
                continue
            already_exists = db.session.query(
                exists().where(Group.name == username)
            ).scalar()
            if not already_exists:
                break

        # If no candidates in claims: try fallback login
        else:
            # If no candidates in claims: try fallback login
            sub_md5 = hashlib.md5(userinfo["sub"].encode("utf-8")).hexdigest()[:8]
            username = f"{provider_name}-{sub_md5}"

        if "email" in userinfo.keys():
            user_email = userinfo["email"]
        else:
            user_email = f'{userinfo["sub"]}@mwdb.local'

        user = User.create(
            username,
            user_email,
            "Registered via OpenID Connect protocol",
        )

        identity = OpenIDUserIdentity(
            sub_id=userinfo["sub"], provider_id=provider.id, user_id=user.id
        )

        if not group.add_member(user):
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
        hooks.on_created_membership(group, user)
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


@rate_limited_resource
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
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        group = provider.get_group()

        schema = OpenIDAuthorizeRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)
        redirect_uri = f"{app_config.mwdb.base_url}/oauth/callback"
        userinfo = provider.fetch_id_token(
            obj["code"], obj["state"], obj["nonce"], redirect_uri
        )
        if db.session.query(
            exists().where(
                and_(
                    OpenIDUserIdentity.provider_id == provider.id,
                    or_(
                        OpenIDUserIdentity.user_id == g.auth_user.id,
                        OpenIDUserIdentity.sub_id == userinfo["sub"],
                    ),
                )
            )
        ).scalar():
            raise Conflict("Provider identity is already bound with mwdb account.")

        identity = OpenIDUserIdentity(
            sub_id=userinfo["sub"], provider_id=provider.id, user_id=g.auth_user.id
        )

        if not group.add_member(g.auth_user):
            raise Conflict("Member is already added")

        db.session.add(identity)

        db.session.commit()

        hooks.on_created_membership(group, g.auth_user)

        logger.info(
            "Account was successfully bound with OpenID Identity",
            extra={"user": g.auth_user.login, "provider": provider.name},
        )


@rate_limited_resource
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


@rate_limited_resource
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
                description: Requested provider doesn't exist
            412:
                description: |
                    Logout endpoint is not specified for this provider
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        provider = (
            db.session.query(OpenIDProvider)
            .filter(OpenIDProvider.name == provider_name)
            .first()
        )
        if not provider:
            raise NotFound(f"Requested provider name '{provider_name}' not found")

        if not provider.logout_endpoint:
            raise NotFound(f"Logout endpoint is not configured for '{provider_name}'")

        schema = OpenIDLogoutLinkResponseSchema()
        return schema.dump({"url": provider.logout_endpoint})
