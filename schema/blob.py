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
    blob_name = fields.Str(required=True)
    blob_size = fields.Int()
    blob_type = fields.Str(required=True)
    last_seen = fields.DateTime()


class BlobListResponseSchema(Schema):
    blobs = fields.Nested(BlobListItemResponseSchema, many=True)


class BlobItemResponseSchema(ObjectItemResponseSchema):
    blob_name = fields.Str()
    blob_size = fields.Int()
    blob_type = fields.Str()
    last_seen = fields.DateTime()

    content = fields.Str()
    latest_config = fields.Nested(ConfigItemResponseSchema)
