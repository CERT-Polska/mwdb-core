from sqlalchemy.dialects.postgresql.array import ARRAY
from sqlalchemy.ext.associationproxy import association_proxy

from mwdb.core.capabilities import Capabilities

from . import db


class Group(db.Model):
    __tablename__ = "group"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(32), index=True, unique=True, nullable=False)
    capabilities = db.Column(
        "capabilities", ARRAY(db.Text), nullable=False, server_default="{}"
    )
    private = db.Column(db.Boolean, nullable=False, default=False)

    members = db.relationship(
        "Member", back_populates="group", cascade="all, delete-orphan"
    )
    users = association_proxy("members", "user", creator=lambda user: Member(user=user))

    PUBLIC_GROUP_NAME = "public"
    EVERYTHING_GROUP_NAME = "everything"

    @property
    def pending_group(self):
        from .user import User

        return (
            self.private
            and db.session.query(User).filter(User.login == self.name).first().pending
        )

    @property
    def immutable(self):
        return self.private or self.name == self.PUBLIC_GROUP_NAME

    @property
    def user_logins(self):
        return [ug.login for ug in self.users]

    @property
    def group_admins(self):
        return [member.user.login for member in self.members if member.group_admin]

    @staticmethod
    def public_group():
        return Group.get_by_name(Group.PUBLIC_GROUP_NAME)

    @staticmethod
    def get_by_name(name):
        return db.session.query(Group).filter(Group.name == name).first()

    @staticmethod
    def all_access_groups():
        return (
            db.session.query(Group)
            .filter(Group.capabilities.contains([Capabilities.access_all_objects]))
            .all()
        )


class Member(db.Model):
    __tablename__ = "member"

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("group.id"), primary_key=True)
    group_admin = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship("User", back_populates="memberships")
    group = db.relationship(Group, back_populates="members", lazy="selectin")
