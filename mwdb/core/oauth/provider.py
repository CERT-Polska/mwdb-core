import hashlib
from typing import TYPE_CHECKING, Iterator

from authlib.oidc.core import UserInfo
from marshmallow import ValidationError
from sqlalchemy import exists

from mwdb.schema.user import UserLoginSchemaBase

from .client import OpenIDClient

if TYPE_CHECKING:
    from mwdb.model import Group, User


class OpenIDProvider:
    """
    OpenID Connect Identity Provider representation with generic handlers.

    You can override these methods with your own implementation
    that is specific for provider.
    """

    scope = "openid profile email"

    def __init__(
        self,
        name,
        client_id,
        client_secret,
        authorization_endpoint,
        token_endpoint,
        userinfo_endpoint,
        jwks_uri,
    ):
        self.name = name
        self.client = OpenIDClient(
            client_id=client_id,
            client_secret=client_secret,
            grant_type="authorization_code",
            response_type="code",
            scope=self.scope,
            authorization_endpoint=authorization_endpoint,
            token_endpoint=token_endpoint,
            userinfo_endpoint=userinfo_endpoint,
            jwks_uri=jwks_uri,
            state=None,
        )

    def get_group_name(self) -> str:
        """
        Group name that is used for registering a new OpenID provider
        """
        return ("OpenID_" + self.name)[:32]

    def create_provider_group(self) -> "Group":
        """
        Creates a Group model object for a new OpenID provider
        """
        from mwdb.model import Group

        group_name = self.get_group_name()
        return Group(name=group_name, immutable=True, workspace=False)

    def iter_user_name_variants(self, sub: bytes, userinfo: UserInfo) -> Iterator[str]:
        """
        Yield username variants that are used when user registers using OpenID identity

        Usernames are yielded starting from most-preferred
        """
        login_claims = ["preferred_username", "nickname", "name"]

        for claim in login_claims:
            username = userinfo.get(claim)
            if not username:
                continue
            yield username
        # If no candidates in claims: try fallback login
        sub_md5 = hashlib.md5(sub.encode("utf-8")).hexdigest()[:8]
        yield f"{self.name}-{sub_md5}"

    def get_user_email(self, sub: bytes, userinfo: UserInfo) -> str:
        """
        User e-mail that is used when user registers using OpenID identity
        """
        if "email" in userinfo.keys():
            return userinfo["email"]
        else:
            return f"{sub}@mwdb.local"

    def get_user_description(self, sub: bytes, userinfo: UserInfo) -> str:
        """
        User description that is used when user registers using OpenID identity
        """
        return "Registered via OpenID Connect protocol"

    def create_user(self, sub: bytes, userinfo: UserInfo) -> "User":
        """
        Creates a User model object for a new OpenID identity user
        """
        from mwdb.model import Group, User, db

        for username in self.iter_user_name_variants(sub, userinfo):
            try:
                UserLoginSchemaBase().load({"login": username})
            except ValidationError:
                continue
            already_exists = db.session.query(
                exists().where(Group.name == username)
            ).scalar()
            if not already_exists:
                break
        else:
            raise RuntimeError("Can't find any good username candidate for user")

        user_email = self.get_user_email(sub, userinfo)
        user_description = self.get_user_description(sub, userinfo)
        return User.create(
            username,
            user_email,
            user_description,
        )
