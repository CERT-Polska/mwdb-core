from . import db


class Tag(db.Model):
    __tablename__ = "tag"
    __table_args__ = (
        db.Index("ix_object_tag_object_id", "tag", "object_id", unique=True),
    )

    id = db.Column(db.Integer, primary_key=True)
    tag = db.Column(db.String, nullable=False, index=True)
    object_id = db.Column(
        db.Integer,
        db.ForeignKey("object.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    object = db.relationship("Object", back_populates="tags", lazy="joined")
