import datetime

from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.exc import IntegrityError

from mwdb.core.ioc import BaseIOC, IOCUpdate

from . import db

object_ioc = db.Table(
    "object_ioc",
    db.Column(
        "object_id",
        db.Integer,
        db.ForeignKey("object.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    ),
    db.Column(
        "ioc_id",
        db.Integer,
        db.ForeignKey("ioc.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    ),
    db.Index("ix_object_ioc_object_ioc", "object_id", "ioc_id", unique=True),
)


class IOC(db.Model):
    __tablename__ = "ioc"
    __table_args__ = (
        db.Index("ix_ioc_type_value", "type", "value", unique=True),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    type = db.Column(db.String(50), nullable=False, index=True)
    value = db.Column(db.String, nullable=False, index=True)
    category = db.Column(db.String(100), nullable=True)
    severity = db.Column(db.String(20), nullable=True)
    tags = db.Column(ARRAY(db.String), default=[], server_default="{}")
    creation_time = db.Column(
        db.DateTime, nullable=False, default=datetime.datetime.utcnow
    )

    objects = db.relationship(
        "Object",
        secondary=object_ioc,
        back_populates="iocs",
    )

    @classmethod
    def get_or_create(cls, ioc_data: BaseIOC):
        """
        Get existing IOC or create a new one.

        Uniqueness is based on (type, value). If an existing IOC is found,
        its category, severity, and tags are updated when the new data
        provides different values.

        Returns (ioc, is_new) tuple.
        """
        ioc_type_value = ioc_data.IOC_TYPE.value

        existing = (
            db.session.query(cls)
            .filter(cls.type == ioc_type_value, cls.value == ioc_data.value)
            .first()
        )

        if existing is not None:
            changed = False
            if (
                ioc_data.category is not None
                and existing.category != ioc_data.category
            ):
                existing.category = ioc_data.category
                changed = True
            if ioc_data.severity is not None:
                new_severity = ioc_data.severity.value
                if existing.severity != new_severity:
                    existing.severity = new_severity
                    changed = True
            if ioc_data.tags and existing.tags != ioc_data.tags:
                existing.tags = ioc_data.tags
                changed = True
            if changed:
                db.session.flush()
            return existing, False

        is_new = False
        db.session.begin_nested()
        try:
            ioc = cls(
                type=ioc_type_value,
                value=ioc_data.value,
                category=ioc_data.category,
                severity=(
                    ioc_data.severity.value if ioc_data.severity else None
                ),
                tags=ioc_data.tags,
                creation_time=datetime.datetime.utcnow(),
            )
            db.session.add(ioc)
            db.session.commit()
            is_new = True
        except IntegrityError:
            db.session.rollback()
            ioc = (
                db.session.query(cls)
                .filter(
                    cls.type == ioc_type_value,
                    cls.value == ioc_data.value,
                )
                .first()
            )
            if ioc is None:
                raise

        return ioc, is_new

    def apply_update(self, update: IOCUpdate) -> bool:
        """
        Apply a partial update to this IOC.

        Only fields that were explicitly provided in the update are changed.
        Returns True if any field was modified.
        """
        changed = False

        if update.is_provided("category"):
            new_category = update.category if update.category else None
            if self.category != new_category:
                self.category = new_category
                changed = True

        if update.is_provided("severity"):
            new_severity = update.severity.value if update.severity else None
            if self.severity != new_severity:
                self.severity = new_severity
                changed = True

        if update.is_provided("tags"):
            if self.tags != update.tags:
                self.tags = update.tags
                changed = True

        return changed
