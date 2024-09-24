from typing import Type

from mwdb.core.oauth.provider import OpenIDProvider

from . import db


def get_oidc_provider_class(provider_name: str) -> Type[OpenIDProvider]:
    from mwdb.core.plugins import openid_provider_classes

    return openid_provider_classes.get(provider_name, OpenIDProvider)


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

    group_id = db.Column(db.Integer, db.ForeignKey("group.id"), nullable=False)

    identities = db.relationship(
        "OpenIDUserIdentity",
        back_populates="provider",
        cascade="all, delete-orphan",
    )
    group = db.relationship(
        "Group",
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
