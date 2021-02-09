from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property

from mwdb.core.util import config_decode, config_dhash, config_encode

from . import db
from .object import Object


class Config(Object):
    __tablename__ = "static_config"

    id = db.Column(db.Integer, db.ForeignKey("object.id"), primary_key=True)
    family = db.Column(db.String(32), nullable=False, index=True)
    config_type = db.Column(
        db.String(32), index=True, nullable=False, server_default="static"
    )
    _cfg = db.Column("cfg", JSONB, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": __tablename__,
    }

    @property
    def latest_config(self):
        raise NotImplementedError()

    @hybrid_property
    def cfg(self):
        return config_decode(self._cfg)

    @classmethod
    def get_or_create(
        cls, cfg, family, config_type, parent=None, metakeys=None, share_with=None
    ):
        dhash = config_dhash(cfg)

        cfg_obj = Config(
            dhash=dhash, _cfg=config_encode(cfg), family=family, config_type=config_type
        )
        return cls._get_or_create(
            cfg_obj, parent=parent, metakeys=metakeys, share_with=share_with
        )


# Compatibility reasons
StaticConfig = Config
