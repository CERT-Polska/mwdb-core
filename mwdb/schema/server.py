from marshmallow import Schema, fields


class ServerPingResponseSchema(Schema):
    status = fields.Str(required=True, allow_none=False)


class ServerInfoResponseSchema(Schema):
    server_version = fields.Str(required=True, allow_none=False)
    is_authenticated = fields.Boolean(required=True, allow_none=False)
    is_maintenance_set = fields.Boolean(required=True, allow_none=False)
    is_registration_enabled = fields.Boolean(required=True, allow_none=False)
    is_karton_enabled = fields.Boolean(required=True, allow_none=False)
    recaptcha_site_key = fields.Str(required=True, allow_none=True)


class ServerAdminInfoResponseSchema(Schema):
    rate_limit_enabled = fields.Boolean(required=True, allow_none=False)
    plugins_enabled = fields.Boolean(required=True, allow_none=False)
    active_plugins = fields.Dict(required=True, allow_none=False)
