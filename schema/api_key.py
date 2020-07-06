from marshmallow import Schema, fields


class APIKeyIdentifierBase(Schema):
    id = fields.UUID(required=True, allow_none=False)


class APIKeyTokenResponseSchema(Schema):
    id = fields.UUID()
    issued_on = fields.DateTime()
    issuer_login = fields.Str()
    token = fields.Str()


class APIKeyListItemResponseSchema(Schema):
    id = fields.UUID()
    issued_on = fields.DateTime()
    issuer_login = fields.Str()
