from marshmallow import Schema, fields

from .utils import UTCDateTime


class KartonProcessingInResponseSchema(Schema):
    received_from = fields.List(fields.Str(), required=True, allow_none=False)
    status = fields.List(fields.Str(), required=True, allow_none=False)


class KartonListItemResponseSchema(Schema):
    id = fields.UUID(required=True, allow_none=False)
    status = fields.Str(required=True, allow_none=False)
    last_update = UTCDateTime(required=True, allow_none=True)
    processing_in = fields.Dict(
        key=fields.Str(), values=fields.Nested(KartonProcessingInResponseSchema)
    )


class KartonListResponseSchema(Schema):
    status = fields.Str(required=True, allow_none=False)
    analyses = fields.Nested(KartonListItemResponseSchema, many=True)
