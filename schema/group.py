import re

from marshmallow import Schema, fields, validates, ValidationError


class GroupNameSchemaBase(Schema):
    name = fields.Str(required=True, allow_none=False)

    @validates("name")
    def validate_name(self, name):
        if not re.match("^[A-Za-z0-9_-]{1,32}$", name):
            raise ValidationError(
                "Group should contain max 32 chars and include only letters, digits, underscores and dashes"
            )


class GroupCreateRequestSchema(Schema):
    capabilities = fields.List(fields.Str(), missing=[])


class GroupUpdateRequestSchema(Schema):
    name = fields.Str(missing=None)
    capabilities = fields.List(fields.Str(), missing=None)

    @validates("name")
    def validate_name(self, name):
        if name is not None and not re.match("^[A-Za-z0-9_-]{1,32}$", name):
            raise ValidationError(
                "Group should contain max 32 chars and include only letters, digits, underscores and dashes"
            )


class GroupBasicResponseSchema(GroupNameSchemaBase):
    capabilities = fields.List(fields.Str(), required=True, allow_none=False)
    private = fields.Boolean(required=True)


class GroupItemResponseSchema(GroupNameSchemaBase):
    capabilities = fields.List(fields.Str(), required=True, allow_none=False)
    private = fields.Boolean(required=True)
    users = fields.List(fields.Str(), attribute="user_logins", required=True, allow_none=False)


class GroupListResponseSchema(Schema):
    groups = fields.Nested(GroupItemResponseSchema, many=True, required=True, allow_none=False)


class GroupSuccessResponseSchema(GroupNameSchemaBase):
    pass
