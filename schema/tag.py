from marshmallow import Schema, fields


class TagItemResponseSchema(Schema):
    tag = fields.Str(required=True, allow_none=False)
