from marshmallow import Schema, fields


class IOCListRequestSchema(Schema):
    older_than = fields.Int(missing=None)
    count = fields.Int(missing=10)
    query = fields.Str(missing=None)


class IOCRequestSchema(Schema):
    type = fields.Str(required=True, allow_none=False)
    value = fields.Str(required=True, allow_none=False)
    category = fields.Str(missing=None, allow_none=True)
    severity = fields.Str(missing=None, allow_none=True)
    tags = fields.List(fields.Str(), missing=[], allow_none=False)


class IOCUpdateRequestSchema(Schema):
    category = fields.Str(missing=None, allow_none=True)
    severity = fields.Str(missing=None, allow_none=True)
    tags = fields.List(fields.Str(), missing=None, allow_none=True)


class IOCItemResponseSchema(Schema):
    id = fields.Int(required=True)
    type = fields.Str(required=True)
    value = fields.Str(required=True)
    category = fields.Str(allow_none=True)
    severity = fields.Str(allow_none=True)
    tags = fields.List(fields.Str())
    creation_time = fields.DateTime(format="iso")
