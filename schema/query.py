from marshmallow import Schema, fields, validates, ValidationError


class QuerySchemaBase(Schema):
    name = fields.Str(required=True, allow_none=False)
    query = fields.Str(required=True, allow_none=False)
    type = fields.Str(required=True, allow_none=False)

    @validates("name")
    def validate_comment(self, value):
        if not value:
            raise ValidationError("Please set name to your query.")


class QueryRequestSchema(QuerySchemaBase):
    pass


class QueryResponseSchema(QuerySchemaBase):
    id = fields.Int(required=True, allow_none=False)
    author = fields.Str(required=True, allow_none=False, attribute="author_login")
    timestamp = fields.DateTime(required=True, allow_none=False)