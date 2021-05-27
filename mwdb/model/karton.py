import datetime

from flask import g
from sqlalchemy.dialects.postgresql import JSONB, UUID

from mwdb.core.karton import get_karton_state

from . import db

karton_object = db.Table(
    "karton_object",
    db.Column(
        "analysis_id",
        UUID(as_uuid=True),
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

    @property
    def _karton_state(self):
        state = getattr(g, "karton_state", None)
        if state is None:
            state = get_karton_state()
            g.karton_state = state
        return state

    @property
    def _analysis_state(self):
        analysis_id = str(self.id)
        if analysis_id not in self._karton_state.analyses:
            return None
        if self._karton_state.analyses[analysis_id].is_done:
            return None
        return self._karton_state.analyses[analysis_id]

    @property
    def status(self):
        return "running" if self._analysis_state else "finished"

    @property
    def last_update(self):
        return (
            datetime.datetime.fromtimestamp(self._analysis_state.last_update)
            if self._analysis_state
            else None
        )

    @property
    def processing_in(self):
        if not self._analysis_state:
            return {}
        return {
            queue_name: {
                "received_from": list(
                    set(task.headers["origin"] for task in queue.pending_tasks)
                ),
                "status": list(set(task.status.value for task in queue.pending_tasks)),
            }
            for queue_name, queue in self._analysis_state.pending_queues.items()
        }

    @classmethod
    def get(cls, analysis_id):
        return db.session.query(KartonAnalysis).filter(KartonAnalysis.id == analysis_id)

    @classmethod
    def create(cls, analysis_id, initial_object, arguments=None):
        analysis = KartonAnalysis(
            id=analysis_id, arguments=arguments or {}, objects=[initial_object]
        )
        db.session.add(analysis)
        return analysis
