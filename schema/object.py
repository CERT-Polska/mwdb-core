import json
from marshmallow import Schema, fields, validates_schema, ValidationError, pre_load

from .metakey import MetakeyItemRequestSchema, MetakeyMultipartRequestSchema
from .tag import TagItemResponseSchema


class ObjectListRequestSchema(Schema):
    page = fields.Int(missing=None)
    query = fields.Str(missing=None)
    older_than = fields.Str(missing=None)

    @validates_schema
    def validate_key(self, data):
        if data['page'] is not None and data['older_than'] is not None:
            raise ValidationError(
                "'page' and 'older_than' can't be used simultaneously. Use 'older_than' for new code."
            )


class ObjectCreateRequestSchemaBase(Schema):
    parent = fields.Str(missing=None)
    metakeys = fields.Nested(MetakeyItemRequestSchema, many=True, missing=[])
    upload_as = fields.Str(missing="*", allow_none=False)


class ObjectLegacyCreateRequestSchemaBase(Schema):
    metakeys = fields.Nested(MetakeyMultipartRequestSchema, missing=None)
    upload_as = fields.Str(missing="*", allow_none=False)

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


class ObjectListItemResponseSchema(Schema):
    id = fields.Str(attribute="dhash", required=True, allow_none=False)
    type = fields.Str(required=True, allow_none=False)
    tags = fields.Nested(TagItemResponseSchema, many=True, required=True, allow_none=False)
    upload_time = fields.DateTime(required=True, allow_none=False)


class ObjectListResponseSchema(Schema):
    objects = fields.Nested(ObjectListItemResponseSchema, many=True, required=True, allow_none=False)


class ObjectItemResponseSchema(Schema):
    id = fields.Str(attribute="dhash", required=True, allow_none=False)
    type = fields.Str(required=True, allow_none=False)
    tags = fields.Nested(TagItemResponseSchema, many=True, required=True, allow_none=False)
    upload_time = fields.DateTime(required=True, allow_none=False)

    parents = fields.Nested(ObjectListItemResponseSchema, many=True, required=True, allow_none=False)
    children = fields.Nested(ObjectListItemResponseSchema, many=True, required=True, allow_none=False)
