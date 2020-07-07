from marshmallow import Schema, fields

from .object import (
    ObjectCreateRequestSchemaBase,
    ObjectLegacyCreateRequestSchemaBase,
    ObjectListItemResponseSchema,
    ObjectItemResponseSchema,
)


class ConfigStatsRequestSchema(Schema):
    range = fields.Str(missing="*", allow_none=False)


class ConfigCreateRequestSchema(ObjectCreateRequestSchemaBase):
    family = fields.Str(required=True, allow_none=False)
    config_type = fields.Str(missing="static", allow_none=False)
    cfg = fields.Dict(required=True, allow_none=False)


class ConfigLegacyCreateRequestSchema(ObjectLegacyCreateRequestSchemaBase):
    family = fields.Str(required=True, allow_none=False)
    config_type = fields.Str(missing="static", allow_none=False)
    cfg = fields.Dict(required=True, allow_none=False)


class ConfigListItemResponseSchema(ObjectListItemResponseSchema):
    family = fields.Str()
    config_type = fields.Str()


class ConfigListResponseSchema(Schema):
    configs = fields.Nested(ConfigListItemResponseSchema, many=True)


class ConfigItemResponseSchema(ObjectItemResponseSchema):
    family = fields.Str()
    config_type = fields.Str()
    cfg = fields.Dict()


class ConfigStatsItemResponseSchema(Schema):
    family = fields.Str()
    last_upload = fields.Date()
    count = fields.Int()


class ConfigStatsResponseSchema(Schema):
    families = fields.Nested(ConfigStatsItemResponseSchema, many=True)

