from string import Template

from flask import g
from sqlalchemy import UniqueConstraint
from sqlalchemy.exc import IntegrityError

from mwdb.core.capabilities import Capabilities

from . import db


class Metakey(db.Model):
    __tablename__ = "metakey"
    __table_args__ = (UniqueConstraint("object_id", "key", "value"),)

    id = db.Column(db.Integer, primary_key=True)
    object_id = db.Column(db.Integer, db.ForeignKey("object.id"), nullable=False)
    key = db.Column(
        db.String(64),
        db.ForeignKey("metakey_definition.key", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    value = db.Column(db.Text, nullable=False, index=True)
    template = db.relationship("MetakeyDefinition", lazy="joined")

    @property
    def url(self):
        if self.template.url_template:
            s = Template(self.template.url_template)
            return s.safe_substitute(value=self.value)
        return None

    @property
    def label(self):
        return self.template.label

    @property
    def description(self):
        return self.template.description

    @classmethod
    def get(cls, object_id, key, value):
        return db.session.query(cls).filter(
            (cls.object_id == object_id) & (cls.key == key) & (cls.value == value)
        )

    @classmethod
    def get_or_create(cls, obj):
        """
        Polymophic get or create pattern, useful in dealing with race condition
        resulting in IntegrityError on the unique constraint.
         http://rachbelaid.com/handling-race-condition-insert-with-sqlalchemy/
        Returns tuple with object and boolean value if new object was created or not,
        True == new object
        """

        is_new = False
        new_cls = cls.get(obj.object_id, obj.key, obj.value).first()

        if new_cls is not None:
            return new_cls, is_new

        db.session.begin_nested()

        new_cls = obj
        try:
            db.session.add(new_cls)
            db.session.commit()
            is_new = True
        except IntegrityError:
            db.session.rollback()
            new_cls = cls.get(obj.object_id, obj.key, obj.value).first()
        return new_cls, is_new


class MetakeyPermission(db.Model):
    __tablename__ = "metakey_permission"

    key = db.Column(
        db.String(64),
        db.ForeignKey("metakey_definition.key", ondelete="CASCADE"),
        primary_key=True,
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
        db.Index("ix_metakey_permission_metakey_group", "key", "group_id", unique=True),
    )
    can_read = db.Column(db.Boolean, nullable=False)
    can_set = db.Column(db.Boolean, nullable=False)
    template = db.relationship(
        "MetakeyDefinition",
        foreign_keys=[key],
        lazy="joined",
        back_populates="permissions",
    )
    group = db.relationship(
        "Group",
        foreign_keys=[group_id],
        lazy="joined",
        back_populates="attributes",
    )

    @property
    def group_name(self):
        return self.group.name


class MetakeyDefinition(db.Model):
    __tablename__ = "metakey_definition"

    key = db.Column(db.String(64), primary_key=True)
    label = db.Column(db.String(64), nullable=False)
    description = db.Column(db.Text, nullable=False)
    url_template = db.Column(db.Text, nullable=False)
    hidden = db.Column(db.Boolean, nullable=False, default=False)
    permissions = db.relationship(
        "MetakeyPermission",
        lazy="joined",
        back_populates="template",
        cascade="all, delete",
    )
    metakey = db.relationship(
        "Metakey",
        back_populates="template",
        cascade="all, delete",
    )

    @staticmethod
    def query_for_read(key=None, include_hidden=False):
        """
        Prepares query for attribute keys that currently authenticated user can read

        :param key: Query for specific key (default: all matching keys)
        :param include_hidden: Include hidden keys
        """
        query = db.session.query(MetakeyDefinition)

        if key is not None:
            query = query.filter(MetakeyDefinition.key == key)

        if not include_hidden:
            query = query.filter(MetakeyDefinition.hidden.isnot(True))

        if not g.auth_user.has_rights(Capabilities.reading_all_attributes):
            query = (
                query.join(MetakeyDefinition.permissions)
                .filter(MetakeyPermission.can_read.is_(True))
                .filter(g.auth_user.is_member(MetakeyPermission.group_id))
            )
        return query

    @staticmethod
    def query_for_set(key=None):
        """
        Prepares query for attribute keys that currently authenticated user can set

        :param key: Query for specific key (default: all matching keys)
        """
        query = db.session.query(MetakeyDefinition)

        if key is not None:
            query = query.filter(MetakeyDefinition.key == key)

        if not g.auth_user.has_rights(Capabilities.adding_all_attributes):
            query = (
                query.join(MetakeyDefinition.permissions)
                .filter(MetakeyPermission.can_set.is_(True))
                .filter(g.auth_user.is_member(MetakeyPermission.group_id))
            )
        return query
