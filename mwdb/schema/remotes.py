from marshmallow import Schema, fields


class APIRemotesListResponseSchema(Schema):
    remotes = fields.List(fields.Str())
