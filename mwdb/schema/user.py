import re

from marshmallow import Schema, fields, validates, ValidationError

from .api_key import APIKeyListItemResponseSchema
from .group import GroupBasicResponseSchema, GroupItemResponseSchema


class UserLoginSchemaBase(Schema):
    login = fields.Str(required=True, allow_none=False)

    @validates("login")
    def validate_login(self, value):
        if not re.match("^[A-Za-z0-9_-]{1,32}$", value):
            raise ValidationError(
                "Login should contain max 32 chars and include only letters, digits, underscores and dashes"
            )


class UserCreateRequestSchema(Schema):
    email = fields.Email(required=True, allow_none=False)
    additional_info = fields.Str(required=True, allow_none=False)
    feed_quality = fields.Str(missing="high")
    send_email = fields.Boolean(missing=False)

    @validates("additional_info")
    def validate_additional_info(self, value):
        if not value:
            raise ValidationError(
                "Additional info can't be empty"
            )


class UserUpdateRequestSchema(Schema):
    email = fields.Email(missing=None)
    additional_info = fields.Str(missing=None)
    feed_quality = fields.Str(missing=None)
    send_email = fields.Boolean(missing=None)
    disabled = fields.Boolean(missing=None)

    @validates("additional_info")
    def validate_additional_info(self, value):
        if value == "":
            raise ValidationError(
                "Additional info can't be empty"
            )


class UserItemResponseSchema(UserLoginSchemaBase):
    email = fields.Email(required=True, allow_none=False)
    additional_info = fields.Str(required=True, allow_none=False)
    feed_quality = fields.Str(required=True, allow_none=False)

    requested_on = fields.DateTime(required=True)
    registered_on = fields.DateTime(required=True)
    logged_on = fields.DateTime(required=True)
    set_password_on = fields.DateTime(required=True)
    registrar_login = fields.Str(required=True)

    disabled = fields.Boolean(required=True, allow_none=False)
    pending = fields.Boolean(required=True, allow_none=False)

    groups = fields.Nested(GroupBasicResponseSchema, many=True, required=True, allow_none=False)
    api_keys = fields.Nested(APIKeyListItemResponseSchema, many=True, required=True, allow_none=False)


class UserListItemResponseSchema(UserLoginSchemaBase):
    email = fields.Email(required=True, allow_none=False)
    additional_info = fields.Str(required=True, allow_none=False)
    feed_quality = fields.Str(required=True, allow_none=False)
    requested_on = fields.DateTime(required=True)
    disabled = fields.Boolean(required=True, allow_none=False)
    pending = fields.Boolean(required=True, allow_none=False)
    groups = fields.Nested(GroupItemResponseSchema, many=True, required=True, allow_none=False)


class UserListResponseSchema(UserLoginSchemaBase):
    users = fields.Nested(UserListItemResponseSchema, many=True, required=True, allow_none=False)


class UserSetPasswordTokenResponseSchema(UserLoginSchemaBase):
    token = fields.Str(required=True, allow_none=False)


class UserSuccessResponseSchema(UserLoginSchemaBase):
    pass
