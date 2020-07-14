from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.hybrid import hybrid_property

from core.util import config_encode, config_decode

from . import db
from .object import Object


class Config(Object):
    __tablename__ = 'static_config'

    id = db.Column(db.Integer, db.ForeignKey('object.id'), primary_key=True)
    family = db.Column(db.String(32), nullable=False, index=True)
    config_type = db.Column(db.String(32), index=True, nullable=False, server_default="static")
    _cfg = db.Column("cfg", JSON, nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': __tablename__,
    }

    @property
    def latest_config(self):
        raise NotImplementedError()

    @hybrid_property
    def cfg(self):
        return config_decode(self._cfg)

    @cfg.setter
    def cfg(self, cfg):
        self._cfg = config_encode(cfg)


# Compatibility reasons
StaticConfig = Config
