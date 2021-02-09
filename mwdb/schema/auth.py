from marshmallow import Schema, ValidationError, fields, validates

from .user import UserLoginSchemaBase


class RecaptchaSchemaMixin(Schema):
    recaptcha = fields.Str(allow_none=False)


class AuthLoginRequestSchema(UserLoginSchemaBase):
    password = fields.Str(required=True, allow_none=False)


class AuthRegisterRequestSchema(UserLoginSchemaBase, RecaptchaSchemaMixin):
    email = fields.Email(required=True, allow_none=False)
    additional_info = fields.Str(required=True, allow_none=False)

    @validates("additional_info")
    def validate_additional_info(self, value):
        if not value:
            raise ValidationError("Additional info can't be empty")


class AuthSetPasswordRequestSchema(Schema):
    MIN_PASSWORD_LENGTH = 8
    MAX_PASSWORD_LENGTH = 72  # UTF-8 bytes

    password = fields.Str(required=True, allow_none=False)
    token = fields.Str(required=True, allow_none=False)

    @validates("password")
    def validate_password(self, value):
        if len(value) < self.MIN_PASSWORD_LENGTH:
            raise ValidationError("Password is too short")
        if len(value.encode()) > self.MAX_PASSWORD_LENGTH:
            raise ValidationError(
                "The password should contain no more than 72 bytes "
                "of UTF-8 characters, your password is too long."
            )


class AuthRecoverPasswordRequestSchema(UserLoginSchemaBase, RecaptchaSchemaMixin):
    email = fields.Email(required=True, allow_none=False)


class AuthSuccessResponseSchema(UserLoginSchemaBase):
    token = fields.Str(required=True, allow_none=False)
    capabilities = fields.List(fields.Str(), required=True, allow_none=False)
    groups = fields.List(fields.Str(), required=True, allow_none=False)


class AuthValidateTokenResponseSchema(UserLoginSchemaBase):
    capabilities = fields.List(fields.Str(), required=True, allow_none=False)
    groups = fields.List(fields.Str(), required=True, allow_none=False)
