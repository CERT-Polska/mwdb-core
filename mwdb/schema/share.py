import re

from marshmallow import Schema, ValidationError, fields, validates

from .utils import UTCDateTime


class ShareRequestSchema(Schema):
    group = fields.Str(required=True, allow_none=False)

    @validates("group")
    def validate_name(self, name):
        if not re.match("^[A-Za-z0-9_-]{1,32}$", name):
            raise ValidationError(
                "Group should contain max 32 chars and include only "
                "letters, digits, underscores and dashes"
            )


class ShareGroupListResponseSchema(Schema):
    groups = fields.List(fields.Str(), required=True, allow_none=False)


class ShareItemResponseSchema(Schema):
    group_name = fields.Str(required=True, allow_none=False)
    access_time = UTCDateTime(required=True, allow_none=False)
    reason_type = fields.Str(required=True, allow_none=False)
    access_reason = fields.Str(
        required=True, allow_none=False
    )  # backwards compatibility
    related_object_dhash = fields.Str(required=True, allow_none=True)
    related_object_type = fields.Str(required=True, allow_none=True)
    related_user_login = fields.Str(required=True, allow_none=True)


class ShareListResponseSchema(Schema):
    shares = fields.Nested(
        ShareItemResponseSchema, many=True, required=True, allow_none=False
    )


class ShareInfoResponseSchema(ShareListResponseSchema, ShareGroupListResponseSchema):
    pass
