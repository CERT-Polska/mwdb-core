from sqlalchemy.dialects.postgresql.array import ARRAY
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm.exc import FlushError

from mwdb.core.capabilities import Capabilities

from . import db


class Group(db.Model):
    __tablename__ = "group"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(32), index=True, unique=True, nullable=False)
    capabilities = db.Column(
        "capabilities", ARRAY(db.Text), nullable=False, server_default="{}"
    )
    # Group is user's private group
    private = db.Column(db.Boolean, nullable=False, default=False)
    # New users are automatically added to this group
    default = db.Column(db.Boolean, nullable=False, default=False)
    # Workspace groups have two traits:
    # - group members can list all the other group memebers
    # - they are candidates for sharing when upload_as:*
    workspace = db.Column(db.Boolean, nullable=False, default=True)

    members = db.relationship(
        "Member", back_populates="group", cascade="all, delete-orphan"
    )
    users = association_proxy("members", "user", creator=lambda user: Member(user=user))

    permissions = db.relationship(
        "ObjectPermission",
        back_populates="group",
        cascade="all, delete",
        passive_deletes=True,
    )

    attributes = db.relationship(
        "MetakeyPermission",
        back_populates="group",
        cascade="all, delete",
        passive_deletes=True,
    )

    PUBLIC_GROUP_NAME = "public"
    # These groups are just pre-created for convenience by 'mwdb-core configure'
    DEFAULT_EVERYTHING_GROUP_NAME = "everything"
    DEFAULT_REGISTERED_GROUP_NAME = "registered"

    @property
    def pending_group(self):
        from .user import User

        return (
            self.private
            and db.session.query(User).filter(User.login == self.name).first().pending
        )

    @property
    def immutable(self):
        """
        Immutable groups can't be renamed, joined and left.
        The only thing that can be changed are capabilities.
        """
        return self.private or self.name == self.PUBLIC_GROUP_NAME

    @property
    def user_logins(self):
        return [ug.login for ug in self.users]

    @property
    def group_admins(self):
        return [member.user.login for member in self.members if member.group_admin]

    def add_member(self, user):
        if user in self.users:
            return False

        db.session.begin_nested()
        try:
            self.users.append(user)
            db.session.commit()
        except (FlushError, IntegrityError):
            db.session.rollback()
            return False
        return True

    def remove_member(self, user):
        if user not in self.users:
            return False

        db.session.begin_nested()
        try:
            self.users.remove(user)
            db.session.commit()
        except (FlushError, IntegrityError):
            db.session.rollback()
            return False
        return True

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

    @staticmethod
    def all_default_groups():
        """
        Return all default groups
        """
        return db.session.query(Group).filter(Group.default.is_(True)).all()


class Member(db.Model):
    __tablename__ = "member"

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("group.id"), primary_key=True)
    group_admin = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship("User", back_populates="memberships")
    group = db.relationship(Group, back_populates="members", lazy="selectin")
