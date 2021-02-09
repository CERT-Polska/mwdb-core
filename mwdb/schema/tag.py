from marshmallow import Schema, ValidationError, fields, pre_load, validates


class TagSchemaBase(Schema):
    tag = fields.Str(required=True, allow_none=False)

    @pre_load
    def sanitize_tag(self, params, **kwargs):
        params = dict(params)
        if params.get("tag"):
            params["tag"] = params["tag"].lower().strip()
        return params

    @validates("tag")
    def validate_tag(self, value):
        if not value:
            raise ValidationError("Tag shouldn't be empty")


class TagListRequestSchema(Schema):
    query = fields.Str(missing="")


class TagRequestSchema(TagSchemaBase):
    pass


class TagItemResponseSchema(TagSchemaBase):
    pass
