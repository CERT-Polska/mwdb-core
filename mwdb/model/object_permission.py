import datetime

from flask import g
from sqlalchemy import and_, exists, or_
from sqlalchemy.exc import IntegrityError

from mwdb.core.capabilities import Capabilities

from . import db


class AccessType:
    ADDED = "added"
    SHARED = "shared"
    QUERIED = "queried"
    MIGRATED = "migrated"


class ObjectPermission(db.Model):
    __tablename__ = "permission"

    object_id = db.Column(
        db.Integer,
        db.ForeignKey("object.id", ondelete="CASCADE"),
        primary_key=True,
        autoincrement=False,
        index=True,
    )
    group_id = db.Column(
        db.Integer,
        db.ForeignKey("group.id", ondelete="CASCADE"),
        primary_key=True,
        autoincrement=False,
        index=True,
    )
    __table_args__ = (
        db.Index("ix_permission_group_object", "object_id", "group_id", unique=True),
    )

    access_time = db.Column(
        db.DateTime, nullable=False, index=True, default=datetime.datetime.utcnow
    )

    reason_type = db.Column(db.String(32))
    related_object_id = db.Column(db.Integer, db.ForeignKey("object.id"))
    related_user_id = db.Column(
        db.Integer, db.ForeignKey("user.id", ondelete="SET NULL"), index=True
    )

    object = db.relationship(
        "Object",
        foreign_keys=[object_id],
        lazy="joined",
        back_populates="shares",
    )
    related_object = db.relationship(
        "Object",
        foreign_keys=[related_object_id],
        lazy="joined",
        back_populates="related_shares",
    )
    related_user = db.relationship(
        "User",
        foreign_keys=[related_user_id],
        lazy="joined",
        back_populates="permissions",
    )

    group = db.relationship(
        "Group",
        foreign_keys=[group_id],
        lazy="joined",
        back_populates="permissions",
    )

    @property
    def access_reason(self):
        # TODO: This is just for backwards compatibility.
        # Remove that part in further major release
        if self.reason_type == "migrated":
            return "Migrated from mwdbv1"
        return (
            "{reason_type} {related_object_type}:{related_object_dhash} "
            "by user:{related_user_login}".format(
                reason_type=self.reason_type,
                related_object_type=self.related_object_type,
                related_object_dhash=self.related_object_dhash,
                related_user_login=self.related_user_login,
            )
        )

    @property
    def group_name(self):
        return self.group.name

    @property
    def related_object_dhash(self):
        return self.related_object.dhash

    @property
    def related_object_type(self):
        return self.related_object.type

    @property
    def related_user_login(self):
        return self.related_user.login

    @property
    def get_explicit_groups(self):
        """
        Get object tags
        :return: List of group ids with object explicit permissions
        """
        return [group.id for group in self.group]

    @classmethod
    def create(cls, object_id, group_id, reason_type, related_object, related_user):
        if not db.session.query(
            exists().where(
                and_(
                    ObjectPermission.object_id == object_id,
                    ObjectPermission.group_id == group_id,
                )
            )
        ).scalar():
            try:
                perm = ObjectPermission(
                    object_id=object_id,
                    group_id=group_id,
                    reason_type=reason_type,
                    related_object=related_object,
                    related_user=related_user,
                )
                db.session.add(perm)
                db.session.flush()
                # Capabilities were created right now
                return True
            except IntegrityError:
                db.session.rollback()
                if not db.session.query(
                    exists().where(
                        and_(
                            ObjectPermission.object_id == object_id,
                            ObjectPermission.group_id == group_id,
                        )
                    )
                ).scalar():
                    raise
        # Capabilities exist yet
        return False

    def make_inherited(self, devisor: "ObjectPermission"):
        """
        Modifies share to inherit from another devisor
        """
        assert self.group_id == devisor.group_id
        self.related_object_id = devisor.related_object_id
        self.reason_type = devisor.reason_type
        self.access_time = datetime.datetime.utcnow()

    def inherits(self, origin_share):
        """
        Checks if share (possibly) was inherited from the origin
        Assumes that origin_share comes from the parent.
        """
        assert self.group_id == origin_share.group_id
        return (
            self.related_object_id == origin_share.related_object_id
            and self.reason_type == origin_share.reason_type
        )

    @staticmethod
    def get_uploaders_filter():
        """
        Prepares filter condition for ObjectPermission objects that describe
        object direct uploaders visible for currently authenticated user
        """
        from .group import Group, Member

        # Users with access_uploader_info can see every upload
        if g.auth_user.has_rights(
            Capabilities.access_uploader_info
        ) or g.auth_user.has_rights(Capabilities.sharing_with_all):
            return and_(
                ObjectPermission.object_id == ObjectPermission.related_object_id,
                ObjectPermission.reason_type == AccessType.ADDED,
            )
        else:
            # list of user_ids who are in a common workspace with auth_user
            members = (
                db.session.query(Member.user_id)
                .join(Group.members)
                .filter(g.auth_user.is_member(Group.id))
                .filter(Group.workspace.is_(True))
            )
            return and_(
                ObjectPermission.object_id == ObjectPermission.related_object_id,
                ObjectPermission.reason_type == AccessType.ADDED,
                or_(
                    ObjectPermission.related_user_id == g.auth_user.id,
                    ObjectPermission.related_user_id.in_(members),
                ),
            )

    @staticmethod
    def get_shares_filter(include_inherited_uploads=True):
        """
        Prepares filter condition for ObjectPermission objects that describe
        object shares visible for currently authenticated user

        :param include_inherited_uploads: |
            Include e.g. inherited ADDED entries, so get_shares_query
            is complementary to get_uploaders_query.
            If false: it returns only SHARED entries
        """
        if include_inherited_uploads:
            type_filter = or_(
                ObjectPermission.reason_type != AccessType.ADDED,
                ObjectPermission.related_object_id != ObjectPermission.object_id,
            )
        else:
            type_filter = ObjectPermission.reason_type == AccessType.SHARED

        if not g.auth_user.has_rights(Capabilities.sharing_with_all):
            return and_(type_filter, g.auth_user.is_member(ObjectPermission.group_id))
        else:
            return type_filter
