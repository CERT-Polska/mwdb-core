from marshmallow import Schema, fields

from .object import (
    ObjectCreateRequestSchemaBase,
    ObjectLegacyCreateRequestSchemaBase,
    ObjectListItemResponseSchema,
    ObjectItemResponseSchema
)
from .metakey import MetakeyMultipartRequestSchema
from .config import ConfigItemResponseSchema


class FileCreateRequestSchema(ObjectCreateRequestSchemaBase):
    metakeys = fields.Nested(MetakeyMultipartRequestSchema, missing=None)


class FileLegacyCreateRequestSchema(ObjectLegacyCreateRequestSchemaBase):
    pass


class FileListItemResponseSchema(ObjectListItemResponseSchema):
    file_name = fields.Str()
    file_size = fields.Int()
    file_type = fields.Str()

    md5 = fields.Str()
    sha256 = fields.Str()


class FileListResponseSchema(Schema):
    files = fields.Nested(FileListItemResponseSchema, many=True)


class FileItemResponseSchema(ObjectItemResponseSchema):
    file_name = fields.Str()
    file_size = fields.Int()
    file_type = fields.Str()

    md5 = fields.Str()
    sha1 = fields.Str()
    sha256 = fields.Str()
    sha512 = fields.Str()
    crc32 = fields.Str()
    humanhash = fields.Str()
    ssdeep = fields.Str()
    latest_config = fields.Nested(ConfigItemResponseSchema)
