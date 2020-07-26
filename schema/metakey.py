import re
from marshmallow import Schema, fields, pre_load, validates, ValidationError


class MetakeyKeySchema(Schema):
    key = fields.Str(required=True, allow_none=False)

    @pre_load
    def sanitize_key(self, params):
        params = dict(params)
        if params.get("key"):
            params["key"] = params["key"].lower().strip()
        return params

    @validates("key")
    def validate_key(self, value):
        if not re.match("^[A-Za-z0-9_-]{1,32}$", value):
            raise ValidationError(
                "Key should contain max 32 chars and include only letters, digits, underscores and dashes"
            )


class MetakeyValueSchema(Schema):
    value = fields.Str(required=True, allow_none=False)

    @validates("value")
    def validate_value(self, value):
        if not value:
            raise ValidationError("Value shouldn't be empty")


class MetakeyItemRequestSchema(MetakeyKeySchema, MetakeyValueSchema):
    pass
