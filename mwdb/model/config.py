from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property

from mwdb.core.karton import send_config_to_karton
from mwdb.core.util import config_decode, config_dhash, config_encode

from . import db
from .object import Object


class Config(Object):
    family = db.Column(db.String(32), index=True)
    config_type = db.Column(db.String(32), index=True)
    _cfg = db.Column("cfg", JSONB)

    __mapper_args__ = {
        "polymorphic_identity": "static_config",
    }

    @property
    def latest_config(self):
        raise NotImplementedError()

    @hybrid_property
    def cfg(self):
        return config_decode(self._cfg)

    @classmethod
    def get_or_create(
        cls,
        cfg,
        family,
        share_3rd_party,
        config_type=None,
        parent=None,
        attributes=None,
        share_with=None,
        analysis_id=None,
        tags=None,
    ):
        dhash = config_dhash(cfg)

        cfg_obj = Config(
            dhash=dhash,
            _cfg=config_encode(cfg),
            family=family,
            config_type=config_type or "static",
            share_3rd_party=share_3rd_party,
        )
        return cls._get_or_create(
            cfg_obj,
            share_3rd_party=share_3rd_party,
            parent=parent,
            attributes=attributes,
            share_with=share_with,
            analysis_id=analysis_id,
            tags=tags,
        )

    def _send_to_karton(self):
        return send_config_to_karton(self)


# Compatibility reasons
StaticConfig = Config
