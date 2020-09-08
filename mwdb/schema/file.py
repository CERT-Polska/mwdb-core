import json
from marshmallow import fields, Schema, pre_load, ValidationError

from .object import (
    ObjectCreateRequestSchemaBase,
    ObjectLegacyMetakeysMixin,
    ObjectListItemResponseSchema,
    ObjectListResponseSchemaBase,
    ObjectItemResponseSchema
)
from .config import ConfigItemResponseSchema


class FileCreateRequestSchema(Schema):
    options = fields.Nested(ObjectCreateRequestSchemaBase, missing={})

    @pre_load
    def unpack_options(self, params):
        """
        Options are packed into JSON string that needs to be deserialized first.
        Empty string in 'options' field is treated like missing key.
        """
        params = dict(params)
        if "options" in params:
            if params["options"]:
                params["options"] = json.loads(params["options"])
            else:
                del params["options"]
        return params


class FileLegacyCreateRequestSchema(ObjectCreateRequestSchemaBase, ObjectLegacyMetakeysMixin):
    pass


class FileListItemResponseSchema(ObjectListItemResponseSchema):
    file_name = fields.Str(required=True, allow_none=False)
    file_size = fields.Int(required=True, allow_none=False)
    file_type = fields.Str(required=True, allow_none=False)

    md5 = fields.Str(required=True, allow_none=False)
    sha256 = fields.Str(required=True, allow_none=False)


class FileListResponseSchema(ObjectListResponseSchemaBase, FileListItemResponseSchema):
    __envelope_key__ = "files"


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
