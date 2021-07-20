from marshmallow import Schema, fields

from .utils import UTCDateTime


class APIKeyIdentifierBase(Schema):
    id = fields.UUID(required=True, allow_none=False)


class APIKeyTokenResponseSchema(APIKeyIdentifierBase):
    issued_on = UTCDateTime(required=True, allow_none=False)
    issuer_login = fields.Str(required=True, allow_none=False)
    name = fields.Str(required=True, allow_none=False)
    token = fields.Str(required=True, allow_none=False)


class APIKeyListItemResponseSchema(APIKeyIdentifierBase):
    issued_on = UTCDateTime(required=True, allow_none=False)
    issuer_login = fields.Str(required=True, allow_none=False)
    name = fields.Str(required=True, allow_none=False)


class APIKeyIssueRequestSchema(Schema):
    name = fields.Str(missing="", allow_none=False)
