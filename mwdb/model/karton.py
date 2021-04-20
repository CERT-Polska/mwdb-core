import datetime

from sqlalchemy.dialects.postgresql import JSONB, UUID

from . import db

karton_object = db.Table(
    "karton_object",
    db.Column(
        "analysis_id",
        db.Integer,
        db.ForeignKey("karton_analysis.id"),
        index=True,
        nullable=False,
    ),
    db.Column(
        "object_id", db.Integer, db.ForeignKey("object.id"), index=True, nullable=False
    ),
    db.Index("ix_karton_analysis_object", "analysis_id", "object_id", unique=True),
)


class KartonAnalysis(db.Model):
    __tablename__ = "karton_analysis"

    id = db.Column(UUID(as_uuid=True), primary_key=True)
    creation_time = db.Column(
        db.DateTime, default=datetime.datetime.utcnow, nullable=False
    )
    arguments = db.Column(JSONB, nullable=False)

    objects = db.relationship(
        "Object",
        secondary=karton_object,
        back_populates="analyses",
    )

    @classmethod
    def get(cls, analysis_id):
        return db.session.query(KartonAnalysis).filter(KartonAnalysis.id == analysis_id)

    @classmethod
    def create(cls, analysis_id, arguments, initial_object):
        analysis = KartonAnalysis(id=analysis_id, arguments=arguments)
        analysis.objects.append(initial_object)
        db.session.add(analysis)
        return analysis
