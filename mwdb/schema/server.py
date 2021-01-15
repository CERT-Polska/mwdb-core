from marshmallow import Schema, fields


class ServerPingResponseSchema(Schema):
    status = fields.Str(required=True, allow_none=False)


class ServerInfoResponseSchema(Schema):
    server_version = fields.Str(required=True, allow_none=False)
    is_authenticated = fields.Boolean(required=True, allow_none=False)
    is_maintenance_set = fields.Boolean(required=True, allow_none=False)
    is_registration_enabled = fields.Boolean(required=True, allow_none=False)
    recaptcha_site_key = fields.Str(required=True, allow_none=True)
    base_url = fields.Str(required=True, allow_none=False)
    # Dict() supporting keys and values is added to marshmallow 3.x
    active_plugins = fields.Dict(required=True, allow_none=False)
    remotes = fields.List(fields.Str(), required=True, allow_none=False)
