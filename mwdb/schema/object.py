from marshmallow import Schema, fields, post_dump

from .attribute import AttributeItemRequestSchema, AttributeItemResponseSchema
from .tag import TagItemResponseSchema, TagRequestSchema
from .utils import UTCDateTime


class ObjectListRequestSchema(Schema):
    query = fields.Str(missing=None)
    older_than = fields.Str(missing=None)
    count = fields.Int(missing=10)


class ObjectCountRequestSchema(Schema):
    query = fields.Str(missing=None)


class ObjectCreateRequestSchemaBase(Schema):
    parent = fields.Str(missing=None)
    attributes = fields.Nested(AttributeItemRequestSchema, many=True, missing=[])
    upload_as = fields.Str(missing="*", allow_none=False)
    karton_id = fields.UUID(missing=None)
    karton_arguments = fields.Dict(missing={}, keys=fields.Str())
    tags = fields.Nested(TagRequestSchema, many=True, missing=[])
    share_3rd_party = fields.Boolean(missing=True)


class ObjectListItemResponseSchema(Schema):
    id = fields.Str(attribute="dhash", required=True, allow_none=False)
    type = fields.Str(required=True, allow_none=False)
    tags = fields.Nested(
        TagItemResponseSchema, many=True, required=True, allow_none=False
    )
    upload_time = UTCDateTime(required=True, allow_none=False)


class ObjectListResponseSchemaBase(Schema):
    __envelope_key__ = "objects"

    @post_dump(pass_many=True)
    def wrap_with_envelope(self, data, many, **kwargs):
        if not many:
            raise ValueError("Schema supports only lists of objects")
        return {self.__envelope_key__: data}


class ObjectListResponseSchema(
    ObjectListResponseSchemaBase, ObjectListItemResponseSchema
):
    pass


class ObjectItemResponseSchema(Schema):
    id = fields.Str(attribute="dhash", required=True, allow_none=False)
    type = fields.Str(required=True, allow_none=False)
    tags = fields.Nested(
        TagItemResponseSchema, many=True, required=True, allow_none=False
    )
    upload_time = UTCDateTime(required=True, allow_none=False)
    favorite = fields.Boolean(required=True, allow_none=False)

    parents = fields.Method(serialize="_get_parents")
    children = fields.Method(serialize="_get_children")
    attributes = fields.Method(serialize="_get_attributes")
    share_3rd_party = fields.Boolean(required=True, allow_none=False)

    def _get_parents(self, object):
        object_parents = object.get_limited_parents_per_type()
        schema = ObjectListItemResponseSchema()
        return schema.dump(object_parents, many=True)

    def _get_children(self, object):
        object_children = object.get_limited_children_per_type()
        schema = ObjectListItemResponseSchema()
        return schema.dump(object_children, many=True)

    def _get_attributes(self, object):
        object_attributes = object.get_attributes()
        schema = AttributeItemResponseSchema()
        return schema.dump(object_attributes, many=True)


class ObjectCountResponseSchema(Schema):
    count = fields.Int()
