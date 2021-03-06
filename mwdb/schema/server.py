from marshmallow import Schema, fields


class ServerPingResponseSchema(Schema):
    status = fields.Str(required=True, allow_none=False)


class ServerInfoResponseSchema(Schema):
    server_version = fields.Str(required=True, allow_none=False)
    is_authenticated = fields.Boolean(required=True, allow_none=False)
    is_maintenance_set = fields.Boolean(required=True, allow_none=False)
    is_registration_enabled = fields.Boolean(required=True, allow_none=False)
    recaptcha_site_key = fields.Str(required=True, allow_none=True)


class ServerPluginInfoResponseSchema(Schema):
    active_plugins = fields.Dict(required=True, allow_none=False)
