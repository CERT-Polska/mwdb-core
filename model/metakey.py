from string import Template

from sqlalchemy import UniqueConstraint
from sqlalchemy.exc import IntegrityError

from . import db


class Metakey(db.Model):
    __tablename__ = 'metakey'
    __table_args__ = (UniqueConstraint("object_id", "key", "value"),)

    id = db.Column(db.Integer, primary_key=True)
    object_id = db.Column(db.Integer, db.ForeignKey('object.id'))
    key = db.Column(db.String(64), db.ForeignKey('metakey_definition.key'), index=True)
    value = db.Column(db.Text, index=True)
    template = db.relationship('MetakeyDefinition', lazy='joined')

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
            (cls.object_id == object_id) & (cls.key == key) & (cls.value == value))

    @classmethod
    def get_or_create(cls, obj):
        """
        Polymophic get or create pattern, useful in dealing with race condition resulting in IntegrityError
        on the unique constraint.
        Pattern from here - http://rachbelaid.com/handling-race-condition-insert-with-sqlalchemy/
        Returns tuple with object and boolean value if new object was created or not, True == new object
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
    __tablename__ = 'metakey_permission'

    key = db.Column(db.String(64), db.ForeignKey('metakey_definition.key'), primary_key=True, index=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), primary_key=True, autoincrement=False, index=True)
    __table_args__ = (
        db.Index('ix_metakey_permission_metakey_group', 'key', 'group_id', unique=True),
    )
    can_read = db.Column(db.Boolean, nullable=False)
    can_set = db.Column(db.Boolean, nullable=False)
    template = db.relationship('MetakeyDefinition', foreign_keys=[key], lazy='joined',
                               back_populates="permissions")
    group = db.relationship('Group', foreign_keys=[group_id], lazy='joined')

    @property
    def group_name(self):
        return self.group.name


class MetakeyDefinition(db.Model):
    __tablename__ = 'metakey_definition'

    key = db.Column(db.String(64), primary_key=True)
    label = db.Column(db.String(64))
    description = db.Column(db.Text)
    url_template = db.Column(db.Text)
    hidden = db.Column(db.Boolean, nullable=False, default=False)
    permissions = db.relationship('MetakeyPermission', lazy='joined', back_populates="template")
