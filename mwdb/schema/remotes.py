from marshmallow import Schema, fields


class RemotesListResponseSchema(Schema):
    remotes = fields.List(fields.Str())


class RemoteOptionsRequestSchema(Schema):
    upload_as = fields.Str(required=True, allow_none=False)
