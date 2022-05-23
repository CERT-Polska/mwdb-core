import re

from marshmallow import Schema, ValidationError, fields, pre_load, validate, validates


class AttributeKeySchema(Schema):
    key = fields.Str(required=True, allow_none=False)

    @pre_load
    def sanitize_key(self, params, **kwargs):
        params = dict(params)
        if params.get("key"):
            params["key"] = params["key"].lower().strip()
        return params

    @validates("key")
    def validate_key(self, value):
        if not re.match("^[A-Za-z0-9_-]{1,32}$", value):
            raise ValidationError(
                "Key should contain max 32 chars and include only letters, "
                "digits, underscores and dashes"
            )


class AttributeValueSchema(Schema):
    value = fields.Raw(required=True, allow_none=False)

    @validates("value")
    def validate_value(self, value):
        if not value:
            raise ValidationError("Value shouldn't be empty")


class AttributeListRequestSchema(Schema):
    hidden = fields.Boolean(missing=False)


class AttributeItemRequestSchema(AttributeKeySchema, AttributeValueSchema):
    pass


class AttributeDefinitionListRequestSchema(Schema):
    access = fields.Str(
        validate=validate.OneOf(["read", "set", "manage"]), missing="read"
    )


class AttributeDefinitionCreateRequestSchema(AttributeKeySchema):
    label = fields.Str(required=True, allow_none=False)
    description = fields.Str(required=True, allow_none=False)
    url_template = fields.Str(missing="", allow_none=False)
    rich_template = fields.Str(missing="", allow_none=False)
    example_value = fields.Str(missing="", allow_none=False)
    hidden = fields.Boolean(required=True, allow_none=False)


class AttributeDefinitionUpdateRequestSchema(Schema):
    label = fields.Str(missing=None)
    description = fields.Str(missing=None)
    url_template = fields.Str(missing=None)
    rich_template = fields.Str(missing=None)
    example_value = fields.Str(missing=None)
    hidden = fields.Boolean(missing=None)


class AttributePermissionUpdateRequestSchema(Schema):
    group_name = fields.Str(required=True, allow_none=False)
    can_read = fields.Boolean(required=True, allow_none=False)
    can_set = fields.Boolean(required=True, allow_none=False)


class AttributePermissionDeleteRequestSchema(Schema):
    group_name = fields.Str(required=True, allow_none=False)


class AttributeItemResponseSchema(AttributeKeySchema, AttributeValueSchema):
    id = fields.Integer(required=True, allow_none=False)


class AttributeListResponseSchema(Schema):
    attributes = fields.Nested(AttributeItemResponseSchema, many=True)


class AttributeDefinitionItemResponseSchema(AttributeKeySchema):
    url_template = fields.Str(required=True, allow_none=False)
    rich_template = fields.Str(required=True, allow_none=False)
    example_value = fields.Str(required=True, allow_none=False)
    label = fields.Str(required=True, allow_none=False)
    description = fields.Str(required=True, allow_none=False)
    hidden = fields.Boolean(required=True, allow_none=False)


class AttributeDefinitionListResponseSchema(Schema):
    attribute_definitions = fields.Nested(
        AttributeDefinitionItemResponseSchema, many=True
    )


class AttributePermissionItemResponseSchema(Schema):
    group_name = fields.Str(required=True, allow_none=False)
    can_read = fields.Boolean(required=True, allow_none=False)
    can_set = fields.Boolean(required=True, allow_none=False)


class AttributePermissionListResponseSchema(Schema):
    attribute_permissions = fields.Nested(
        AttributePermissionItemResponseSchema, many=True
    )
