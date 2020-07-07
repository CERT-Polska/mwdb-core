from marshmallow import Schema, fields


class MetakeyItemRequestSchema(Schema):
    key = fields.Str(required=True, allow_none=False)
    value = fields.Str(required=True, allow_none=False)


class MetakeyMultipartRequestSchema(Schema):
    metakeys = fields.Nested(MetakeyItemRequestSchema, many=True, missing=[])
