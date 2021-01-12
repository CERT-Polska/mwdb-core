from marshmallow import Schema, fields


class RemotesListResponseSchema(Schema):
    remotes = fields.List(fields.Str())
