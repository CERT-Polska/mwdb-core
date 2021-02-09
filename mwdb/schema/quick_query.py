from marshmallow import Schema, ValidationError, fields, validates

from .utils import UTCDateTime


class QuickQuerySchemaBase(Schema):
    query = fields.Str(required=True, allow_none=False)
    name = fields.Str(required=True, allow_none=False)
    type = fields.Str(required=True, allow_none=False)

    @validates("name")
    def validate_comment(self, value):
        if not value:
            raise ValidationError("Name should not be empty.")


class QuickQueryRequestSchema(QuickQuerySchemaBase):
    pass


class QuickQueryResponseSchema(QuickQuerySchemaBase):
    id = fields.Int(required=True, allow_none=False)
    timestamp = UTCDateTime(required=True, allow_none=False)
