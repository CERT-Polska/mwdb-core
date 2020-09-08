from marshmallow import Schema, fields


class DownloadURLResponseSchema(Schema):
    url = fields.Str(required=True, allow_none=False)
