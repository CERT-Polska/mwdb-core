from marshmallow import Schema, fields

from .object import ObjectListItemResponseSchema


class RelationsResponseSchema(Schema):
    parents = fields.Nested(
        ObjectListItemResponseSchema, many=True, required=True, allow_none=False
    )
    children = fields.Nested(
        ObjectListItemResponseSchema, many=True, required=True, allow_none=False
    )
