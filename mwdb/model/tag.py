from sqlalchemy.exc import IntegrityError

from . import db

object_tag_table = db.Table(
    "object_tag",
    db.metadata,
    db.Column(
        "object_id", db.Integer, db.ForeignKey("object.id"), index=True, nullable=False
    ),
    db.Column(
        "tag_id", db.Integer, db.ForeignKey("tag.id"), index=True, nullable=False
    ),
    db.Index("ix_object_tag_object_child", "object_id", "tag_id", unique=True),
)


class Tag(db.Model):
    __tablename__ = "tag"
    id = db.Column(db.Integer, primary_key=True)

    tag = db.Column(db.String, nullable=False, unique=True, index=True)
    objects = db.relationship(
        "Object", secondary=object_tag_table, back_populates="tags"
    )

    @classmethod
    def get(cls, tag):
        return db.session.query(cls).filter(cls.tag == tag)

    @classmethod
    def get_or_create(cls, tag_obj):
        """
        Polymophic get or create pattern, useful in dealing with race condition
        resulting in IntegrityError on the unique constraint.
        http://rachbelaid.com/handling-race-condition-insert-with-sqlalchemy/
        Returns tuple with object and boolean value if new object was created or not,
        True == new object
        """

        is_new = False
        new_cls = cls.get(tag_obj.tag).first()

        if new_cls is not None:
            return new_cls, is_new

        db.session.begin_nested()

        new_cls = tag_obj
        try:
            db.session.add(new_cls)
            db.session.commit()
            is_new = True
        except IntegrityError:
            db.session.rollback()
            new_cls = cls.get(tag_obj.tag).first()
        return new_cls, is_new
