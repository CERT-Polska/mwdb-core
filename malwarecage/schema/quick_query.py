from marshmallow import Schema, fields, validates, ValidationError


class QuickQuerySchemaBase(Schema):
    quick_query = fields.Str(required=True, allow_none=False)
    name = fields.Str(required=True, allow_none=False)
    type = fields.Str(required=True, allow_none=False)

    @validates("name")
    def validate_comment(self, value):
        if not value:
            raise ValidationError("Please set name to your query.")


class QuickQueryRequestSchema(QuickQuerySchemaBase):
    pass


class QuickQueryResponseSchema(QuickQuerySchemaBase):
    id = fields.Int(required=True, allow_none=False)
    owner = fields.Str(required=True, allow_none=False, attribute="owner_login")
    timestamp = fields.DateTime(required=True, allow_none=False)
