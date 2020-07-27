import re
from marshmallow import Schema, fields, validates_schema, ValidationError


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


class ObjectShowBase(ObjectBase, RelationsSchema):
    pass


class MultiObjectSchema(Schema):
    objects = fields.Nested(ObjectBase, many=True)


class ConfigSchema(ObjectBase):
    family = fields.Str(required=True)
    config_type = fields.Str()


class ConfigShowSchema(ObjectShowBase):
    family = fields.Str(required=True)
    config_type = fields.Str()
    cfg = fields.Dict(required=True)


class MultiConfigSchema(Schema):
    configs = fields.Nested(ConfigSchema, many=True)


class TextBlobSchema(ObjectBase):
    blob_name = fields.Str(required=True)
    blob_size = fields.Int()
    blob_type = fields.Str(required=True)
    last_seen = fields.DateTime()


class TextBlobShowSchema(ObjectShowBase):
    blob_name = fields.Str(required=True)
    blob_size = fields.Int()
    blob_type = fields.Str(required=True)
    last_seen = fields.DateTime()
    content = fields.Str(required=True)
    latest_config = fields.Nested(ConfigShowSchema)


class MultiTextBlobSchema(Schema):
    blobs = fields.Nested(TextBlobSchema, many=True)


class FileSchema(ObjectBase):
    file_name = fields.Str()
    file_size = fields.Int()
    file_type = fields.Str()
    md5 = fields.Str()
    sha256 = fields.Str()


class FileShowSchema(ObjectShowBase):
    file_name = fields.Str()
    file_size = fields.Int()
    file_type = fields.Str()
    crc32 = fields.Str()
    md5 = fields.Str()
    sha1 = fields.Str()
    sha256 = fields.Str()
    sha512 = fields.Str()
    humanhash = fields.Str()
    ssdeep = fields.Str()
    latest_config = fields.Nested(ConfigShowSchema)


class MultiFileShowSchema(Schema):
    files = fields.Nested(FileSchema, many=True)


class URLReturnSchema(Schema):
    url = fields.Str()


class ConfigStatsEntry(Schema):
    family = fields.Str(required=True)
    last_upload = fields.Date(required=True)
    count = fields.Int(required=True)


class ConfigStatsSchema(Schema):
    families = fields.Nested(ConfigStatsEntry, many=True)
