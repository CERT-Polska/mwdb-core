import re

from marshmallow import Schema, fields, validates, ValidationError

from .api_key import APIKeyTokenResponseSchema
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


class UserItemResponseSchema(Schema):
    login = fields.Str()
    email = fields.Str()
    additional_info = fields.Str()
    feed_quality = fields.Str()

    requested_on = fields.DateTime()
    registered_on = fields.DateTime()
    logged_on = fields.DateTime()
    set_password_on = fields.DateTime()
    registrar_login = fields.Str()

    disabled = fields.Boolean()
    pending = fields.Boolean()

    groups = fields.Nested(GroupBasicResponseSchema, many=True)
    api_keys = fields.Nested(APIKeyTokenResponseSchema, many=True)


class UserListItemResponseSchema(Schema):
    login = fields.Str()
    email = fields.Str()
    additional_info = fields.Str()
    feed_quality = fields.Str()
    requested_on = fields.DateTime()
    disabled = fields.Boolean()
    pending = fields.Boolean()
    groups = fields.Nested(GroupItemResponseSchema, many=True)


class UserListResponseSchema(Schema):
    users = fields.Nested(UserListItemResponseSchema, many=True)


class UserSetPasswordTokenResponseSchema(Schema):
    login = fields.Str()
    token = fields.Str()


class UserSuccessResponseSchema(Schema):
    login = fields.Str()
