from marshmallow import Schema, fields, validates, ValidationError

from .api_key import APIKeyTokenResponseSchema
from .group import GroupBasicResponseSchema
from .user import UserLoginSchemaBase


class RecaptchaSchemaMixin(Schema):
    recaptcha = fields.Str()


class AuthLoginRequestSchema(UserLoginSchemaBase):
    password = fields.Str(required=True, allow_none=False)


class AuthRegisterRequestSchema(UserLoginSchemaBase, RecaptchaSchemaMixin):
    email = fields.Email(required=True, allow_none=False)
    additional_info = fields.Str(required=True, allow_none=False)

    @validates("additional_info")
    def validate_additional_info(self, value):
        if not value:
            raise ValidationError(
                "Additional info can't be empty"
            )


class AuthSetPasswordRequestSchema(Schema):
    MIN_PASSWORD_LENGTH = 8
    MAX_PASSWORD_LENGTH = 72  # UTF-8 bytes

    password = fields.Str(required=True, allow_none=False)
    token = fields.Str(required=True, allow_none=False)

    @validates("password")
    def validate_password(self, value):
        if len(value) < self.MIN_PASSWORD_LENGTH:
            raise ValidationError(
                "Password is too short"
            )
        if len(value.encode()) > self.MAX_PASSWORD_LENGTH:
            raise ValidationError(
                "The password should contain no more than 72 bytes of UTF-8 characters, "
                "your password is too long."
            )


class AuthRecoverPasswordRequestSchema(UserLoginSchemaBase, RecaptchaSchemaMixin):
    email = fields.Email(required=True, allow_none=False)


class AuthSuccessResponseSchema(Schema):
    login = fields.Str()
    token = fields.Str()
    capabilities = fields.List(fields.Str())
    groups = fields.List(fields.Str())


class AuthValidateTokenResponseSchema(Schema):
    login = fields.Str()
    capabilities = fields.List(fields.Str())
    groups = fields.List(fields.Str())


class AuthProfileResponseSchema(Schema):
    login = fields.Str()
    email = fields.Str()

    registered_on = fields.DateTime()
    logged_on = fields.DateTime()
    set_password_on = fields.DateTime()

    capabilities = fields.List(fields.Str())
    groups = fields.Nested(GroupBasicResponseSchema, many=True)
    api_keys = fields.Nested(APIKeyTokenResponseSchema, many=True)
