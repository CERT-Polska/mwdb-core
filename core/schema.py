import re
from marshmallow import Schema, fields, validates_schema, ValidationError


class ServerInfoSchema(Schema):
    server_version = fields.Str()
    is_authenticated = fields.Boolean()
    is_maintenance_set = fields.Boolean()
    is_registration_enabled = fields.Boolean()
    recaptcha_site_key = fields.Str()


class CapabilitiesSchema(Schema):
    capabilities = fields.List(fields.Str(), allow_none=True)


class GroupsSchema(Schema):
    groups = fields.List(fields.Str())


class GroupNameSchemaBase(Schema):
    name = fields.Str()

    @validates_schema
    def validate_name(self, data):
        if "name" in data and not re.match("^[A-Za-z0-9_-]{1,32}$", data["name"]):
            raise ValidationError(
                "Group should contain max 32 chars and include only letters, digits, underscores and dashes")


class GroupSchema(CapabilitiesSchema, GroupNameSchemaBase):
    private = fields.Boolean()
    users = fields.List(fields.Str(), attribute="user_logins")


class UserGroupSchema(CapabilitiesSchema, GroupNameSchemaBase):
    private = fields.Boolean()


class MultiGroupShowSchema(Schema):
    groups = fields.Nested(GroupSchema, many=True)


class APIKeySchema(Schema):
    id = fields.Str()
    issued_on = fields.DateTime()


class APIKeyManageSchema(APIKeySchema):
    issuer_login = fields.Str()


class APIKeyTokenSchema(APIKeySchema):
    token = fields.Str()


class UserLoginSchemaBase(Schema):
    login = fields.Str(required=True)

    @validates_schema
    def validate_login(self, data):
        if "login" in data and not re.match("^[A-Za-z0-9_-]{1,32}$", data["login"]):
            raise ValidationError(
                "Login should contain max 32 chars and include only letters, digits, underscores and dashes")


class UserLoginSchema(UserLoginSchemaBase):
    password = fields.Str(required=True)


class UserIdentitySchema(UserLoginSchemaBase, CapabilitiesSchema, GroupsSchema):
    pass


class UserTokenSchema(UserLoginSchemaBase):
    token = fields.Str(required=True)


class UserSetPasswordSchema(Schema):
    password = fields.Str(required=True)
    token = fields.Str(required=True)


class UserBasicInfoSchema(Schema):
    email = fields.Str()
    groups = fields.Nested(UserGroupSchema, many=True)
    additional_info = fields.Str()
    disabled = fields.Boolean()


class UserBasicManageInfoSchema(UserBasicInfoSchema):
    requested_on = fields.DateTime()
    pending = fields.Boolean()
    send_email = fields.Boolean()
    feed_quality = fields.Str()


class UserProfileInfoSchema(UserBasicInfoSchema):
    registered_on = fields.DateTime()
    logged_on = fields.DateTime()
    set_password_on = fields.DateTime()
    api_keys = fields.Nested(APIKeySchema, many=True)


class UserProfileManageInfoSchema(UserProfileInfoSchema, UserBasicManageInfoSchema):
    registrar_login = fields.Str()
    api_keys = fields.Nested(APIKeyManageSchema, many=True)


class MultiUserBasicSchema(UserLoginSchemaBase, UserBasicManageInfoSchema):
    pass


class UserProfileSchema(UserLoginSchemaBase, UserProfileInfoSchema):
    pass


class UserManageSchema(UserLoginSchemaBase, UserProfileManageInfoSchema):
    pass


class MultiUserShowSchema(Schema):
    users = fields.Nested(MultiUserBasicSchema, many=True)


class UserRegisterSchema(UserLoginSchemaBase, UserBasicInfoSchema):
    recaptcha = fields.Str()


class UserLoginSuccessSchema(UserTokenSchema, UserIdentitySchema):
    pass


class UserSuccessSchema(UserLoginSchemaBase):
    pass


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

    @validates_schema
    def validate_value(self, data):
        if 'value' not in data:
            raise ValidationError("You must specify value")


class MetakeyDefinitionSchema(MetakeySchemaBase):
    template = fields.Str(attribute="url_template")


class MetakeyShowSchema(Schema):
    metakeys = fields.Nested(MetakeySchema, many=True)


class MetakeyDefinitionShowSchema(Schema):
    metakeys = fields.Nested(MetakeyDefinitionSchema, many=True)


class CommentSchemaBase(Schema):
    comment = fields.Str()


class CommentSchema(CommentSchemaBase):
    id = fields.Int()
    author = fields.Str()
    timestamp = fields.DateTime()


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


class ConfigStatsEntry(Schema):
    family = fields.Str(required=True)
    last_upload = fields.Date(required=True)
    count = fields.Int(required=True)


class ConfigStatsSchema(Schema):
    families = fields.Nested(ConfigStatsEntry, many=True)
