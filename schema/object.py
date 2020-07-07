from marshmallow import Schema, fields, validates_schema, ValidationError

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


class ObjectListItemResponseSchema(Schema):
    id = fields.Str(attribute="dhash")
    type = fields.Str()
    tags = fields.Nested(TagItemResponseSchema, many=True)
    upload_time = fields.DateTime()


class ObjectListResponseSchema(Schema):
    objects = fields.Nested(ObjectListItemResponseSchema, many=True)


class ObjectItemResponseSchema(Schema):
    id = fields.Str(attribute="dhash")
    type = fields.Str()
    tags = fields.Nested(TagItemResponseSchema, many=True)
    upload_time = fields.DateTime()

    parents = fields.Nested(ObjectListItemResponseSchema, many=True)
    children = fields.Nested(ObjectListItemResponseSchema, many=True)
