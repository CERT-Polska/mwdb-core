import datetime
from collections import namedtuple
from typing import Optional
from uuid import UUID

from flask import g
from sqlalchemy import and_, cast, distinct, exists, func, or_, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import aliased, column_property, contains_eager
from sqlalchemy.sql.expression import true

from mwdb.core.capabilities import Capabilities

from . import db
from .attribute import Attribute, AttributeDefinition, AttributePermission
from .karton import KartonAnalysis, karton_object
from .tag import Tag

relation = db.Table(
    "relation",
    db.Column(
        "parent_id", db.Integer, db.ForeignKey("object.id"), index=True, nullable=False
    ),
    db.Column(
        "child_id", db.Integer, db.ForeignKey("object.id"), index=True, nullable=False
    ),
    db.Column("creation_time", db.DateTime, default=datetime.datetime.utcnow),
    db.Index("ix_relation_parent_child", "parent_id", "child_id", unique=True),
)

favorites = db.Table(
    "favorites",
    db.Column(
        "user_id", db.Integer, db.ForeignKey("user.id"), index=True, nullable=False
    ),
    db.Column(
        "object_id", db.Integer, db.ForeignKey("object.id"), index=True, nullable=False
    ),
    db.Index("ix_favorites_object_user", "object_id", "user_id", unique=True),
)


class AccessType:
    ADDED = "added"
    SHARED = "shared"
    QUERIED = "queried"
    MIGRATED = "migrated"


class ObjectTypeConflictError(Exception):
    pass


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


class Object(db.Model):
    __tablename__ = "object"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    type = db.Column(db.String(50), index=True, nullable=False)
    dhash = db.Column(db.String(64), unique=True, index=True, nullable=False)
    upload_time = db.Column(
        db.DateTime, nullable=False, index=True, default=datetime.datetime.utcnow
    )
    share_3rd_party = db.Column(db.Boolean, nullable=False)

    upload_count = column_property(
        select([func.count(distinct(ObjectPermission.related_user_id))]).where(
            and_(
                ObjectPermission.object_id == id,
                ObjectPermission.reason_type == AccessType.ADDED,
            )
        ),
        deferred=True,
    )

    __mapper_args__ = {"polymorphic_identity": "object", "polymorphic_on": type}

    parents = db.relationship(
        "Object",
        secondary=relation,
        primaryjoin=(id == relation.c.child_id),
        secondaryjoin=(id == relation.c.parent_id),
        order_by=relation.c.creation_time.desc(),
        back_populates="children",
    )
    children = db.relationship(
        "Object",
        secondary=relation,
        primaryjoin=(id == relation.c.parent_id),
        secondaryjoin=(id == relation.c.child_id),
        order_by=relation.c.creation_time.desc(),
        back_populates="parents",
    )

    attributes = db.relationship(
        "Attribute", backref="object", lazy=True, cascade="save-update, merge, delete"
    )
    comments = db.relationship(
        "Comment", backref="object", lazy="dynamic", passive_deletes=True
    )
    tags = db.relationship(
        "Tag",
        back_populates="object",
        lazy="joined",
        cascade="save-update, merge, delete",
    )

    followers = db.relationship(
        "User", secondary=favorites, back_populates="favorites", lazy="joined"
    )

    comment_authors = db.relationship(
        "User",
        secondary="comment",
        back_populates="commented_objects",
        passive_deletes=True,
    )

    shares = db.relationship(
        "ObjectPermission",
        lazy="dynamic",
        foreign_keys=[ObjectPermission.object_id],
        back_populates="object",
        cascade="save-update, merge, delete",
        order_by=ObjectPermission.access_time.asc(),
    )

    related_shares = db.relationship(
        "ObjectPermission",
        lazy="dynamic",
        foreign_keys=[ObjectPermission.related_object_id],
        back_populates="related_object",
        order_by=ObjectPermission.access_time.asc(),
    )

    analyses = db.relationship(
        "KartonAnalysis",
        secondary=karton_object,
        back_populates="objects",
    )

    @property
    def latest_config(self):
        from .config import Config

        return (
            db.session.query(Config)
            .join(
                relation,
                and_(relation.c.parent_id == self.id, relation.c.child_id == Config.id),
            )
            .filter(g.auth_user.has_access_to_object(Config.id))
            .order_by(relation.c.creation_time.desc())
            .first()
        )

    @property
    def favorite(self):
        return g.auth_user in self.followers

    def add_parent(self, parent, commit=True):
        """
        Adding parent with permission inheritance
        """
        if parent in self.parents:
            # Relationship already exist
            return False

        # Add relationship in nested transaction
        db.session.begin_nested()
        try:
            self.parents.append(parent)
            db.session.flush()
            db.session.commit()
        except IntegrityError:
            # The same relationship was added concurrently
            db.session.rollback()
            db.session.refresh(self)
            if parent not in self.parents:
                raise
            return False
        # Inherit permissions from parent (in the same transaction)
        permissions = (
            db.session.query(ObjectPermission)
            .filter(ObjectPermission.object_id == parent.id)
            .all()
        )
        for perm in permissions:
            self.give_access(
                perm.group_id,
                perm.reason_type,
                perm.related_object,
                perm.related_user,
                commit=False,
            )
        if commit:
            db.session.commit()
        return True

    def remove_parent(self, parent, commit=True):
        """
        Removing child with modify permission inheritance
        """
        if parent not in self.parents:
            # Relationship not exist
            return False

        # Remove relationship in nested transaction
        db.session.begin_nested()

        try:
            # Remove inherited permissions from parent
            if parent.id != self.id:
                for share in parent.shares:
                    self.uninherit_share(share)
            # Remove parent
            self.parents.remove(parent)
            db.session.flush()
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            db.session.refresh(self)
            if parent in self.parents:
                raise
            return False

        if commit:
            db.session.commit()
        return True

    def get_share_for_group(self, group_id) -> Optional[ObjectPermission]:
        """
        Finds share (ObjectPermission) for given group id.
        If share doesn't exist: returns None.
        """
        return next(
            (share for share in self.shares if share.group_id == group_id), None
        )

    def _find_another_devisor(self, share_to_remove):
        """
        Looks for another devisor for given share inherited from given parent.
        Share must be inherited (related_object_id is not None and comes from parent)
        """
        new_devisor = None
        # For each other parent
        for parent in self.parents:
            if parent.id == share_to_remove.object_id:
                continue
            share = parent.get_share_for_group(share_to_remove.group_id)
            # If parent is not shared with given group: ignore
            if share is None:
                continue
            # If other parent is inherited as well: nothing to change
            if share.inherits(share_to_remove):
                return share_to_remove
            else:
                # If found another devisor: store it but keep looking
                # for other
                new_devisor = share
        return new_devisor

    def uninherit_share(self, share_to_remove, new_devisor=None, visited=None):
        # Break the c-c-c-cycles
        visited = visited or set()
        if self in visited:
            return
        else:
            visited.add(self)
        # Get our share for the same group as share_to_remove
        our_share = self.get_share_for_group(share_to_remove.group_id)
        # If it doesn't exist or it's unrelated: just return
        if not our_share or not our_share.inherits(share_to_remove):
            return
        # Find new devisor different than share_to_remove
        if new_devisor is None:
            new_devisor = self._find_another_devisor(share_to_remove)
        # If there's nothing to change (same share is given by another parent): return
        if new_devisor is share_to_remove:
            return
        # If there is a change: first uninherit all children
        for child in self.children:
            child.uninherit_share(our_share, new_devisor=new_devisor, visited=visited)
        if not new_devisor:
            # If there is no devisor: remove share
            db.session.delete(our_share)
        else:
            # If there is a new devisor: remap current share to inherit from it
            our_share.make_inherited(new_devisor)

    def give_access(
        self, group_id, reason_type, related_object, related_user, commit=True
    ):
        """
        Give access to group with recursive propagation
        """
        visited = set()
        queue = [self]
        while len(queue):
            obj = queue.pop(0)
            if obj.id in visited:
                continue
            visited.add(obj.id)
            if ObjectPermission.create(
                obj.id, group_id, reason_type, related_object, related_user
            ):
                """
                If permission was just created: continue propagation
                """
                queue += obj.children

        if commit:
            db.session.commit()

    def has_explicit_access(self, user):
        """
        Check whether user has access via explicit ObjectPermissions
        Used by Object.access
        """
        if user.has_rights(Capabilities.access_all_objects):
            return True

        return db.session.query(
            exists().where(
                and_(
                    ObjectPermission.object_id == self.id,
                    user.is_member(ObjectPermission.group_id),
                )
            )
        ).scalar()

    def check_group_explicit_access(self, group):
        """
        Check whether group has access via explicit ObjectPermissions
        Used by Object.access
        """
        if Capabilities.access_all_objects in group.capabilities:
            return True

        return db.session.query(
            exists().where(
                and_(
                    ObjectPermission.object_id == self.id,
                    ObjectPermission.group_id == group.id,
                )
            )
        ).scalar()

    @classmethod
    def get(cls, identifier):
        """
        Polymorphic getter for object via specified identifier(provided by API)
        without access check-ups.
        Don't include internal (sequential) identifiers in filtering!
        Used by Object.access
        """
        return cls.query.filter(cls.dhash == identifier.lower())

    @classmethod
    def _get_or_create(
        cls,
        obj,
        share_3rd_party,
        parent=None,
        attributes=None,
        share_with=None,
        analysis_id=None,
        tags=None,
    ):
        """
        Polymophic get or create pattern, useful in dealing with race condition
        resulting in IntegrityError on the dhash unique constraint.

        http://rachbelaid.com/handling-race-condition-insert-with-sqlalchemy/
        Returns tuple with object and boolean value if new object was created or not,
        True == new object

        We don't perform permission checks, all data needs to be validated by Resource.
        """

        share_with = share_with or []
        attributes = attributes or []
        tags = tags or []

        is_new = False
        created_object = Object.get(obj.dhash).first()

        # Object with the specified dhash doesn't exist - create it
        if created_object is None:
            db.session.begin_nested()

            created_object = obj
            try:
                # Try to create the requested object
                created_object.upload_time = datetime.datetime.utcnow()
                db.session.add(created_object)
                db.session.commit()
                is_new = True
            except IntegrityError:
                # Object creation failed - probably a race condition
                db.session.rollback()
                created_object = Object.get(obj.dhash).first()
                # If object still doesn't exist, IntegrityError is not
                # caused by concurrent upload: re-raise exception
                if created_object is None:
                    raise

        if not is_new:
            # If Object already exists, try to fetch typed instance
            # to ensure that there is no type conflict
            created_object = cls.get(obj.dhash).first()
            if created_object is None:
                raise ObjectTypeConflictError

        # Add attributes
        for attribute in attributes:
            created_object.add_attribute(
                attribute["key"], attribute["value"], commit=False
            )

        # Share with all specified groups
        for share_group in share_with:
            if share_group.name == g.auth_user.login:
                created_object.give_access(
                    share_group.id,
                    AccessType.ADDED,
                    created_object,
                    g.auth_user,
                    commit=False,
                )
            else:
                created_object.give_access(
                    share_group.id,
                    AccessType.SHARED,
                    created_object,
                    g.auth_user,
                    commit=False,
                )

        # Add parent to object if specified
        # Inherited share entries must be added AFTER we add share entries
        # related with upload itself
        if parent:
            created_object.add_parent(parent, commit=False)

        if analysis_id:
            created_object.assign_analysis(analysis_id)

        # Add tags to object if specified
        for tag in tags:
            tag_name = tag["tag"]
            created_object.add_tag(tag_name, commit=False)

        created_object.share_3rd_party = (
            created_object.share_3rd_party or share_3rd_party
        )

        return created_object, is_new

    @classmethod
    def access(cls, identifier, requestor=None):
        """
        Gets object with specified identifier including requestor rights.

        Returns None when user has no rights to specified object or object doesn't exist

        :param identifier: Object identifier
        :param requestor: |
            User requesting for object
            (default: currently authenticated user)
        :return: Object instance or None
        """
        from .group import Group

        if requestor is None:
            requestor = g.auth_user

        obj = cls.get(identifier)
        # If object doesn't exist - it doesn't exist
        if obj.first() is None:
            return None

        # In that case we want only those parents to which requestor has access.
        stmtp = (
            db.session.query(Object)
            .join(relation, relation.c.parent_id == Object.id)
            .filter(
                Object.id.in_(
                    db.session.query(relation.c.parent_id).filter(
                        relation.c.child_id == obj.first().id
                    )
                )
            )
            .order_by(relation.c.creation_time.desc())
            .filter(requestor.has_access_to_object(Object.id))
        )
        stmtp = stmtp.subquery()

        parent = aliased(Object, stmtp)

        obj = (
            obj.outerjoin(parent, Object.parents)
            .options(contains_eager(Object.parents, alias=parent))
            .all()[0]
        )

        # Ok, now let's check whether requestor has explicit access
        if obj.has_explicit_access(requestor):
            return obj

        # If not, but has "share_queried_objects" rights: give_access
        if requestor.has_rights(Capabilities.share_queried_objects):
            share_queried_groups = (
                db.session.query(Group)
                .filter(
                    and_(
                        Group.capabilities.contains(
                            [Capabilities.share_queried_objects]
                        ),
                        requestor.is_member(Group.id),
                    )
                )
                .all()
            )
            for group in share_queried_groups:
                obj.give_access(group.id, AccessType.QUERIED, obj, requestor)
            return obj
        # Well.. I've tried
        return None

    def release_after_upload(self):
        """
        Release additional resources used by uploaded file.

        For objects other than File it's just no-op.
        """
        return

    def get_tags(self):
        """
        Get object tags
        :return: List of strings representing tags
        """
        return [
            tag.tag
            for tag in db.session.query(Tag).filter(Tag.object_id == self.id).all()
        ]

    def add_tag(self, tag_name, commit=True):
        """
        Adds new tag to object.
        :param tag_name: tag string
        :param commit: Commit transaction after operation
        :return: True if tag wasn't added yet
        """
        db_tag = (
            db.session.query(Tag)
            .filter(Tag.tag == tag_name, Tag.object_id == self.id)
            .first()
        )
        if db_tag:
            return False

        is_new = False
        db.session.begin_nested()
        try:
            db_tag = Tag(tag=tag_name, object_id=self.id)
            db.session.add(db_tag)
            db.session.commit()
            is_new = True
        except IntegrityError:
            db.session.rollback()
            db.session.refresh(self)
            if db_tag not in self.tags:
                raise

        if commit:
            db.session.commit()
        return is_new

    def remove_tag(self, tag_name, commit=True):
        """
        Removes tag from object
        :param tag_name: tag string
        :return: True if tag wasn't removed yet
        """
        db_tag = (
            db.session.query(Tag)
            .filter(Tag.tag == tag_name, Tag.object_id == self.id)
            .first()
        )
        if not db_tag:
            return False

        is_removed = False
        db.session.begin_nested()
        try:
            db.session.delete(db_tag)
            db.session.commit()
            is_removed = True
        except IntegrityError:
            db.session.rollback()
            db.session.refresh(self)
            if db_tag in self.tags:
                raise

        if commit:
            db.session.commit()
        return is_removed

    def get_attributes(
        self,
        as_dict=False,
        check_permissions=True,
        show_hidden=False,
        show_karton=False,
    ):
        """
        Gets all object attributes

        :param as_dict: |
            Return dict object instead of list of Attribute objects (default: False)
        :param check_permissions: |
            Filter results including current user permissions (default: True)
        :param show_hidden: Show hidden attributes
        :param show_karton: Show Karton attributes (for compatibility)
        """
        attributes = (
            db.session.query(Attribute)
            .filter(Attribute.object_id == self.id)
            .join(Attribute.template)
        )

        if check_permissions and not g.auth_user.has_rights(
            Capabilities.reading_all_attributes
        ):
            attributes = attributes.filter(
                Attribute.key.in_(
                    db.session.query(AttributePermission.key)
                    .filter(AttributePermission.can_read == true())
                    .filter(g.auth_user.is_member(AttributePermission.group_id))
                )
            )

        if not show_hidden:
            attributes = attributes.filter(AttributeDefinition.hidden.is_(False))

        attributes = attributes.order_by(Attribute.id).all()

        if show_karton:
            KartonAttribute = namedtuple("KartonAttribute", ["key", "value"])

            attributes += [
                KartonAttribute(key="karton", value=str(analysis.id))
                for analysis in (
                    db.session.query(KartonAnalysis)
                    .filter(KartonAnalysis.objects.any(id=self.id))
                    .order_by(KartonAnalysis.creation_time)
                    .all()
                )
            ]

        if not as_dict:
            return attributes

        dict_attributes = {}
        for attribute in attributes:
            if attribute.key not in dict_attributes:
                dict_attributes[attribute.key] = []
            dict_attributes[attribute.key].append(attribute.value)
        return dict_attributes

    def add_attribute(
        self, key, value, commit=True, check_permissions=True, include_karton=True
    ):
        if include_karton and key == "karton":
            karton_id = UUID(value)

            if check_permissions and not g.auth_user.has_rights(
                Capabilities.karton_assign
            ):
                # User doesn't have permissions to assign analysis
                return None

            _, is_new = self.assign_analysis(karton_id, commit=False)

            if commit:
                db.session.commit()
            return is_new

        if check_permissions:
            attribute_definition = AttributeDefinition.query_for_set(key).first()
        else:
            attribute_definition = (
                db.session.query(AttributeDefinition).filter(
                    AttributeDefinition.key == key
                )
            ).first()

        if not attribute_definition:
            # Attribute needs to be defined first
            return None

        db_attribute = Attribute(key=key, value=value, object_id=self.id)
        _, is_new = Attribute.get_or_create(db_attribute)
        if commit:
            db.session.commit()
        return is_new

    def remove_attribute_by_id(self, attribute_id, check_permissions=True):
        attribute_query = Attribute.get_by_id(self.id, attribute_id)

        if check_permissions and not g.auth_user.has_rights(
            Capabilities.adding_all_attributes
        ):
            attribute_query = attribute_query.filter(
                Attribute.key.in_(
                    db.session.query(AttributePermission.key)
                    .filter(AttributePermission.can_set == true())
                    .filter(g.auth_user.is_member(AttributePermission.group_id))
                )
            )

        try:
            rows = attribute_query.delete(synchronize_session="fetch")
            db.session.commit()
            return rows > 0
        except IntegrityError:
            db.session.refresh(self)
            if attribute_query.first():
                raise
        return True

    def remove_attribute(self, key, value, check_permissions=True):
        attribute_query = db.session.query(Attribute).filter(
            Attribute.key == key, Attribute.object_id == self.id
        )
        if value:
            attribute_query = attribute_query.filter(
                Attribute.value == cast(value, JSONB)
            )

        if check_permissions and not AttributeDefinition.query_for_set(key).first():
            return False

        try:
            rows = attribute_query.delete(synchronize_session="fetch")
            db.session.commit()
            return rows > 0
        except IntegrityError:
            db.session.refresh(self)
            if attribute_query.first():
                raise
        return True

    def get_uploaders(self):
        """
        Gets all object uploads visible for currently authenticated user
        :rtype: List[ObjectPermission]
        """
        return (
            db.session.query(ObjectPermission)
            .filter(ObjectPermission.object_id == self.id)
            .filter(ObjectPermission.get_uploaders_filter())
            .order_by(ObjectPermission.access_time.asc())
        ).all()

    def get_shares(self):
        """
        Gets all object shares visible for currently authenticated user
        :rtype: List[ObjectPermission]
        """
        return (
            db.session.query(ObjectPermission)
            .filter(ObjectPermission.object_id == self.id)
            .filter(ObjectPermission.get_shares_filter())
            .order_by(ObjectPermission.access_time.asc())
        ).all()

    def _send_to_karton(self):
        raise NotImplementedError

    def spawn_analysis(self, arguments, commit=True):
        """
        Spawns new KartonAnalysis for this object
        """
        analysis_id = self._send_to_karton()
        analysis = KartonAnalysis.create(
            analysis_id=UUID(analysis_id),
            initial_object=self,
            arguments=arguments,
        )
        if commit:
            db.session.commit()
        return analysis

    def assign_analysis(self, analysis_id, commit=True):
        """
        Assigns KartonAnalysis to the object
        """
        analysis, is_new = KartonAnalysis.get_or_create(analysis_id, self)

        if not is_new and analysis.id not in [
            existing.id for existing in self.analyses
        ]:
            db.session.begin_nested()
            try:
                self.analyses.append(analysis)
                db.session.commit()
                is_new = True
            except IntegrityError:
                # The same relationship was added concurrently
                db.session.rollback()
                db.session.refresh(self)
                if analysis.id not in [existing.id for existing in self.analyses]:
                    raise

        if commit:
            db.session.commit()
        return analysis, is_new

    def is_analyzed(self):
        return bool(self.analyses)

    def get_analysis_status(self):
        if not self.analyses:
            return "not_analyzed"
        for analysis in self.analyses:
            if analysis.status == "running":
                return "running"
        return "finished"

    def remove_analysis(self, analysis_id, commit=True):
        """
        Removes analysis from object
        :param analysis_id: uuid
        :return: True if analysis was removed
        """
        db_analysis = db.session.query(KartonAnalysis).filter(
            KartonAnalysis.id == analysis_id
        )
        db_analysis = db_analysis.first()
        if db_analysis is None:
            return False

        if db_analysis not in self.analyses:
            return False

        is_removed = False
        db.session.begin_nested()
        try:
            self.analyses.remove(db_analysis)
            db.session.commit()
            is_removed = True
        except IntegrityError:
            db.session.rollback()
            db.session.refresh(self)
            if db_analysis in self.analyses:
                raise
        # delete analysis if no objects associated
        if db_analysis.objects == []:
            db.session.delete(db_analysis)

        if commit:
            db.session.commit()
        return is_removed
