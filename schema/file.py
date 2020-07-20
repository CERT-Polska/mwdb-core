import json

from marshmallow import Schema, fields, pre_load

from .object import (
    ObjectCreateRequestSchemaBase,
    ObjectLegacyCreateRequestSchemaBase,
    ObjectListItemResponseSchema,
    ObjectItemResponseSchema
)
from .config import ConfigItemResponseSchema


class FileCreateRequestSchema(Schema):
    options = fields.Nested(ObjectCreateRequestSchemaBase, missing={})

    @pre_load
    def unpack_options(self, params):
        """
        Options are provided as string that need to be deserialized first.
        Empty string is treated as None.
        """
        params = dict(params)
        if "options" in params:
            if params["options"]:
                params["options"] = json.loads(params["options"])
            else:
                # If options string is empty: remove it from params
                del params["options"]
        return params


class FileLegacyCreateRequestSchema(ObjectLegacyCreateRequestSchemaBase):
    @pre_load
    def unpack_metakeys(self, params):
        """
        Metakeys are provided as string that need to be deserialized first.
        Empty string is treated as None.
        """
        params = dict(params)
        if params.get("metakeys"):
            params["metakeys"] = json.loads(params["metakeys"])
        else:
            params["metakeys"] = None
        return params


class FileListItemResponseSchema(ObjectListItemResponseSchema):
    file_name = fields.Str(required=True, allow_none=False)
    file_size = fields.Int(required=True, allow_none=False)
    file_type = fields.Str(required=True, allow_none=False)

    md5 = fields.Str(required=True, allow_none=False)
    sha256 = fields.Str(required=True, allow_none=False)


class FileListResponseSchema(Schema):
    files = fields.Nested(FileListItemResponseSchema, many=True, required=True, allow_none=False)


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
