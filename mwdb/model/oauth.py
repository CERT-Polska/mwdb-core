from enum import Enum
from typing import Type

from mwdb.core.oauth.provider import OpenIDProvider

from . import db
from .group import Group


def get_oidc_provider_class(provider_name: str) -> Type[OpenIDProvider]:
    from mwdb.core.plugins import openid_provider_classes

    return openid_provider_classes.get(provider_name, OpenIDProvider)


class OpenIDGroupManagementMode(Enum):
    NONE = "NONE"
    FULL = "FULL"
    MIXED = "MIXED"


class OpenIDProviderSettings(db.Model):
    __tablename__ = "openid_provider"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(64), nullable=False, unique=True)
    client_id = db.Column(db.Text, nullable=False)
    client_secret = db.Column(db.Text, nullable=True)
    authorization_endpoint = db.Column(db.Text, nullable=False)
    token_endpoint = db.Column(db.Text, nullable=False)
    userinfo_endpoint = db.Column(db.Text, nullable=False)
    jwks_endpoint = db.Column(db.Text, nullable=True)
    logout_endpoint = db.Column(db.Text, nullable=True)
    requires_approval = db.Column(db.Boolean, nullable=False, default=False)
    oidc_groups_management_mode = db.Column(
        db.Enum(OpenIDGroupManagementMode), nullable=False
    )
    oidc_groups_match_pattern = db.Column(db.Text, nullable=False)
    oidc_groups_replace_pattern = db.Column(db.Text, nullable=False)

    group_id = db.Column(db.Integer, db.ForeignKey("group.id"), nullable=False)

    identities = db.relationship(
        "OpenIDUserIdentity",
        back_populates="provider",
        cascade="all, delete-orphan",
    )

    openid_groups = db.relationship(
        "Group",
        foreign_keys=[Group.openid_provider_id],
        back_populates="openid_provider",
        lazy="select",
    )

    group = db.relationship(
        "Group",
        foreign_keys=[group_id],
        cascade="all, delete",
    )

    def get_oidc_provider(self):
        openid_provider_class = get_oidc_provider_class(self.name)
        return openid_provider_class(
            name=self.name,
            client_id=self.client_id,
            client_secret=self.client_secret,
            authorization_endpoint=self.authorization_endpoint,
            token_endpoint=self.token_endpoint,
            userinfo_endpoint=self.userinfo_endpoint,
            jwks_uri=self.jwks_endpoint,
        )


class OpenIDUserIdentity(db.Model):
    __tablename__ = "openid_identity"

    sub_id = db.Column(db.String(256), primary_key=True, nullable=False)
    provider_id = db.Column(
        db.Integer,
        db.ForeignKey("openid_provider.id"),
        primary_key=True,
        nullable=False,
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), primary_key=True, nullable=False
    )

    user = db.relationship("User", back_populates="openid_identities")
    provider = db.relationship(
        OpenIDProviderSettings, back_populates="identities", lazy="selectin"
    )
