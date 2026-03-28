import datetime

from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.exc import IntegrityError

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
    type = db.Column(
        db.String(50), nullable=False, index=True
    )  # ip, domain, url, port, email, hash
    value = db.Column(db.String, nullable=False, index=True)
    category = db.Column(
        db.String(100), nullable=True
    )  # c2, malware, phishing, etc.
    severity = db.Column(
        db.String(20), nullable=True
    )  # low, medium, high, critical
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
    def get_or_create(cls, ioc_type, value, category=None, severity=None, tags=None):
        """
        Get existing IOC or create a new one.
        Uniqueness is based on (type, value).
        Returns (ioc, is_new) tuple.
        """
        tags = tags or []

        existing = (
            db.session.query(cls)
            .filter(cls.type == ioc_type, cls.value == value)
            .first()
        )

        if existing is not None:
            # Update category/severity/tags if provided and currently empty
            changed = False
            if category is not None and existing.category != category:
                existing.category = category
                changed = True
            if severity is not None and existing.severity != severity:
                existing.severity = severity
                changed = True
            if tags and existing.tags != tags:
                existing.tags = tags
                changed = True
            if changed:
                db.session.flush()
            return existing, False

        is_new = False
        db.session.begin_nested()
        try:
            ioc = cls(
                type=ioc_type,
                value=value,
                category=category,
                severity=severity,
                tags=tags,
                creation_time=datetime.datetime.utcnow(),
            )
            db.session.add(ioc)
            db.session.commit()
            is_new = True
        except IntegrityError:
            db.session.rollback()
            ioc = (
                db.session.query(cls)
                .filter(cls.type == ioc_type, cls.value == value)
                .first()
            )
            if ioc is None:
                raise

        return ioc, is_new
