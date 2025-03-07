import json

from marshmallow import (
    Schema,
    ValidationError,
    fields,
    post_dump,
    pre_load,
    validates_schema,
)

from .attribute import AttributeItemRequestSchema, AttributeItemResponseSchema
from .metakey import MetakeyItemRequestSchema
from .tag import TagItemResponseSchema, TagRequestSchema
from .utils import UTCDateTime


class ObjectListRequestSchema(Schema):
    page = fields.Int(missing=None)  # legacy, to be removed in future
    query = fields.Str(missing=None)
    older_than = fields.Str(missing=None)
    count = fields.Int(missing=10)

    @validates_schema
    def validate_key(self, data, **kwargs):
        if data["page"] is not None and data["older_than"] is not None:
            raise ValidationError(
                "'page' and 'older_than' can't be used simultaneously. "
                "Use 'older_than' for new code."
            )


class ObjectCountRequestSchema(Schema):
    query = fields.Str(missing=None)


class ObjectCreateRequestSchemaBase(Schema):
    parent = fields.Str(missing=None)
    metakeys = fields.Nested(MetakeyItemRequestSchema, many=True, missing=[])
    attributes = fields.Nested(AttributeItemRequestSchema, many=True, missing=[])
    upload_as = fields.Str(missing="*", allow_none=False)
    karton_id = fields.UUID(missing=None)
    karton_arguments = fields.Dict(missing={}, keys=fields.Str())
    tags = fields.Nested(TagRequestSchema, many=True, missing=[])
    share_3rd_party = fields.Boolean(missing=True)


class ObjectLegacyMetakeysMixin(Schema):
    @pre_load
    def unpack_metakeys(self, params, **kwargs):
        """
        Metakeys are packed into JSON string that need to be deserialized first.
        Empty string in 'metakeys' field is treated like missing key.
        Request providing metakeys looks like this:
        `curl ... -F="metakeys='{"metakeys": [...]}'"`
        """
        params = dict(params)
        if "metakeys" in params:
            if params["metakeys"]:
                metakeys_json = json.loads(params["metakeys"])
                if "metakeys" not in metakeys_json:
                    raise ValidationError(
                        "Object provided to 'metakeys' field "
                        "must contain 'metakeys' key"
                    )
                params["metakeys"] = metakeys_json["metakeys"]
            else:
                del params["metakeys"]
        return params


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
