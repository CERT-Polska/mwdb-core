from marshmallow import fields

from .object import (
    ObjectCreateRequestSchemaBase,
    ObjectLegacyMetakeysMixin,
    ObjectListItemResponseSchema,
    ObjectListResponseSchema,
    ObjectItemResponseSchema
)
from .config import ConfigItemResponseSchema


class FileCreateRequestSchema(ObjectCreateRequestSchemaBase):
    pass


class FileLegacyCreateRequestSchema(FileCreateRequestSchema, ObjectLegacyMetakeysMixin):
    pass


class FileListItemResponseSchema(ObjectListItemResponseSchema):
    file_name = fields.Str(required=True, allow_none=False)
    file_size = fields.Int(required=True, allow_none=False)
    file_type = fields.Str(required=True, allow_none=False)

    md5 = fields.Str(required=True, allow_none=False)
    sha256 = fields.Str(required=True, allow_none=False)


class FileListResponseSchema(ObjectListResponseSchema):
    __envelope_key__ = "files"
    __item_schewa__ = FileListItemResponseSchema


class FileItemResponseSchema(ObjectItemResponseSchema):
    file_name = fields.Str(required=True, allow_none=False)
    file_size = fields.Int(required=True, allow_none=False)
    file_type = fields.Str(required=True, allow_none=False)

    md5 = fields.Str(required=True, allow_none=False)
    sha1 = fields.Str(required=True, allow_none=False)
    sha256 = fields.Str(required=True, allow_none=False)
    sha512 = fields.Str(required=True, allow_none=False)
    crc32 = fields.Str(required=True, allow_none=False)
    humanhash = fields.Str(required=True, allow_none=False)
    ssdeep = fields.Str(required=True, allow_none=True)

    latest_config = fields.Nested(ConfigItemResponseSchema, required=True, allow_none=True)
