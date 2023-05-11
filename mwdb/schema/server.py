from marshmallow import Schema, fields


class ServerPingResponseSchema(Schema):
    status = fields.Str(required=True, allow_none=False)


class ServerInfoResponseSchema(Schema):
    server_version = fields.Str(required=True, allow_none=False)
    is_authenticated = fields.Boolean(required=True, allow_none=False)
    instance_name = fields.Str(required=True, allow_none=False)
    is_maintenance_set = fields.Boolean(required=True, allow_none=False)
    is_registration_enabled = fields.Boolean(required=True, allow_none=False)
    is_karton_enabled = fields.Boolean(required=True, allow_none=False)
    is_oidc_enabled = fields.Boolean(required=True, allow_none=False)
    is_3rd_party_sharing_consent_enabled = fields.Boolean(
        required=True, allow_none=False
    )
    recaptcha_site_key = fields.Str(required=True, allow_none=True)
    request_timeout = fields.Int(required=True, allow_none=False)
    file_upload_timeout = fields.Int(required=True, allow_none=False)
    statement_timeout = fields.Int(required=False, allow_none=True)


class ServerAdminInfoResponseSchema(Schema):
    rate_limit_enabled = fields.Boolean(required=True, allow_none=False)
    plugins_enabled = fields.Boolean(required=True, allow_none=False)
    active_plugins = fields.Dict(required=True, allow_none=False)
