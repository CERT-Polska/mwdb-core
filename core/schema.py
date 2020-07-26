import re
from marshmallow import Schema, fields, validates_schema, ValidationError


class ServerInfoSchema(Schema):
    server_version = fields.Str()
    is_authenticated = fields.Boolean()
    is_maintenance_set = fields.Boolean()
    is_registration_enabled = fields.Boolean()
    recaptcha_site_key = fields.Str()
    base_url = fields.Str()
    active_plugins = fields.Dict()


class MetakeySchemaBase(Schema):
    key = fields.Str()

    @validates_schema
    def validate_key(self, data):
        if 'key' not in data or not re.match("^[A-Za-z0-9_-]{1,32}$", data["key"]):
            raise ValidationError(
                "Key should contain max 32 chars and include only letters, digits, underscores and dashes")


class MetakeySchema(MetakeySchemaBase):
    value = fields.Str()
    url = fields.Str()
    label = fields.Str()
    description = fields.Str()

    @validates_schema
    def validate_value(self, data):
        if 'value' not in data:
            raise ValidationError("You must specify value")


class MetakeyPermissionSchema(Schema):
    group_name = fields.Str(required=True)
    can_read = fields.Boolean(required=True)
    can_set = fields.Boolean(required=True)


class MetakeyDefinitionSchema(MetakeySchemaBase):
    template = fields.Str(attribute="url_template")
    label = fields.Str()
    description = fields.Str()
    hidden = fields.Boolean()


class MetakeyDefinitionManageSchema(MetakeyDefinitionSchema):
    permissions = fields.Nested(MetakeyPermissionSchema, many=True)


class MetakeyShowSchema(Schema):
    metakeys = fields.Nested(MetakeySchema, many=True)


class MetakeyDefinitionListSchema(Schema):
    metakeys = fields.Nested(MetakeyDefinitionSchema, many=True)


class MetakeyDefinitionManageListSchema(Schema):
    metakeys = fields.Nested(MetakeyDefinitionManageSchema, many=True)


class TagSchema(Schema):
    tag = fields.Str()


class ObjectBase(Schema):
    id = fields.Str(attribute="dhash")
    type = fields.Str()
    tags = fields.Nested(TagSchema, many=True)
    upload_time = fields.DateTime()


class RelationsSchema(Schema):
    parents = fields.Nested(ObjectBase, many=True)
    children = fields.Nested(ObjectBase, many=True)


class URLReturnSchema(Schema):
    url = fields.Str()


class ShareSchema(Schema):
    group = fields.Str()


class ShareObjectSchema(Schema):
    group_name = fields.Str()
    access_time = fields.DateTime()
    reason_type = fields.Str()
    access_reason = fields.Str()  # backwards compatibility
    related_object_dhash = fields.Str()
    related_object_type = fields.Str()
    related_user_login = fields.Str()


class ShareShowSchema(Schema):
    groups = fields.List(fields.Str())
    shares = fields.Nested(ShareObjectSchema, many=True)


class SearchSchema(Schema):
    query = fields.Str()


class PingStatusSchema(Schema):
    status = fields.Str(required=True)
