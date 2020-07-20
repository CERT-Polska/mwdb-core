from marshmallow import Schema, fields

from .object import (
    ObjectCreateRequestSchemaBase,
    ObjectLegacyCreateRequestSchemaBase,
    ObjectListItemResponseSchema,
    ObjectItemResponseSchema,
)
from .config import ConfigItemResponseSchema


class BlobCreateRequestSchema(ObjectCreateRequestSchemaBase):
    blob_name = fields.Str(required=True, allow_none=False)
    blob_type = fields.Str(required=True, allow_none=False)
    content = fields.Str(required=True, allow_none=False)


class BlobLegacyCreateRequestSchema(ObjectLegacyCreateRequestSchemaBase):
    blob_name = fields.Str(required=True, allow_none=False)
    blob_type = fields.Str(required=True, allow_none=False)
    content = fields.Str(required=True, allow_none=False)


class BlobListItemResponseSchema(ObjectListItemResponseSchema):
    blob_name = fields.Str(required=True, allow_none=False)
    blob_size = fields.Int(required=True, allow_none=False)
    blob_type = fields.Str(required=True, allow_none=False)
    last_seen = fields.DateTime(required=True, allow_none=False)


class BlobListResponseSchema(Schema):
    blobs = fields.Nested(BlobListItemResponseSchema, many=True, required=True, allow_none=False)


class BlobItemResponseSchema(ObjectItemResponseSchema):
    blob_name = fields.Str(required=True, allow_none=False)
    blob_size = fields.Int(required=True, allow_none=False)
    blob_type = fields.Str(required=True, allow_none=False)
    last_seen = fields.DateTime(required=True, allow_none=False)

    content = fields.Str(required=True, allow_none=False)
    latest_config = fields.Nested(ConfigItemResponseSchema, required=True, allow_none=True)
