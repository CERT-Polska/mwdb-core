import re

from marshmallow import Schema, ValidationError, fields, pre_load, validates


class MetakeyKeySchema(Schema):
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


class MetakeyValueSchema(Schema):
    value = fields.Str(required=True, allow_none=False)

    @validates("value")
    def validate_value(self, value):
        if not value:
            raise ValidationError("Value shouldn't be empty")


class MetakeyListRequestSchema(Schema):
    hidden = fields.Boolean(missing=False)


class MetakeyItemRequestSchema(MetakeyKeySchema, MetakeyValueSchema):
    pass


class MetakeyItemRemoveRequestSchema(MetakeyKeySchema):
    value = fields.Str(missing=None)


class MetakeyDefinitionItemRequestArgsSchema(MetakeyKeySchema):
    pass


class MetakeyUpdateRequestSchema(Schema):
    label = fields.Str(missing=None)
    description = fields.Str(missing=None)
    template = fields.Str(missing=None)
    hidden = fields.Boolean(missing=None)


class MetakeyDefinitionItemRequestBodySchema(Schema):
    template = fields.Str(attribute="url_template", required=True, allow_none=False)
    label = fields.Str(required=True, allow_none=False)
    description = fields.Str(required=True, allow_none=False)
    hidden = fields.Boolean(required=True, allow_none=False)


class MetakeyPermissionSetRequestArgsSchema(MetakeyKeySchema):
    group_name = fields.Str(required=True, allow_none=False)


class MetakeyPermissionSetRequestBodySchema(Schema):
    can_read = fields.Boolean(required=True, allow_none=False)
    can_set = fields.Boolean(required=True, allow_none=False)


class MetakeyItemResponseSchema(MetakeyKeySchema, MetakeyValueSchema):
    url = fields.Str(required=True)
    label = fields.Str(required=True)
    description = fields.Str(required=True)


class MetakeyPermissionItemResponseSchema(Schema):
    group_name = fields.Str(required=True, allow_none=False)
    can_read = fields.Boolean(required=True, allow_none=False)
    can_set = fields.Boolean(required=True, allow_none=False)


class MetakeyDefinitionItemResponseSchema(MetakeyKeySchema):
    template = fields.Str(attribute="url_template", required=True, allow_none=False)
    label = fields.Str(required=True, allow_none=False)
    description = fields.Str(required=True, allow_none=False)
    hidden = fields.Boolean(required=True, allow_none=False)


class MetakeyDefinitionManageItemResponseSchema(MetakeyKeySchema):
    template = fields.Str(attribute="url_template", required=True, allow_none=False)
    label = fields.Str(required=True, allow_none=False)
    description = fields.Str(required=True, allow_none=False)
    hidden = fields.Boolean(required=True, allow_none=False)
    permissions = fields.Nested(MetakeyPermissionItemResponseSchema, many=True)


class MetakeyListResponseSchema(Schema):
    metakeys = fields.Nested(MetakeyItemResponseSchema, many=True)


class MetakeyDefinitionListResponseSchema(Schema):
    metakeys = fields.Nested(MetakeyDefinitionItemResponseSchema, many=True)


class MetakeyDefinitionManageListResponseSchema(Schema):
    metakeys = fields.Nested(MetakeyDefinitionManageItemResponseSchema, many=True)
