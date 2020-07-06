from marshmallow import Schema, fields


class APIKeyTokenResponseSchema(Schema):
    id = fields.Str()
    issued_on = fields.DateTime()
    issuer_login = fields.Str()
    token = fields.Str()


class APIKeyListItemResponseSchema(Schema):
    id = fields.Str()
    issued_on = fields.DateTime()
    issuer_login = fields.Str()
