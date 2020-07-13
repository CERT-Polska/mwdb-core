from marshmallow import Schema, fields


class APIKeyIdentifierBase(Schema):
    id = fields.UUID(required=True, allow_none=False)


class APIKeyTokenResponseSchema(APIKeyIdentifierBase):
    issued_on = fields.DateTime(required=True, allow_none=False)
    issuer_login = fields.Str(required=True, allow_none=False)
    token = fields.Str(required=True, allow_none=False)


class APIKeyListItemResponseSchema(APIKeyIdentifierBase):
    issued_on = fields.DateTime(required=True, allow_none=False)
    issuer_login = fields.Str(required=True, allow_none=False)
