from datetime import datetime, timezone

from marshmallow import fields


class UTCDateTime(fields.DateTime):
    """
    Naive timestamps were serialized by Marshmallow 2.x as UTC.
    As we're using 3.x and timestamps from database are UTC without tzinfo.
    we need to recover 2.x behavior.
    """

    def _serialize(self, value, *args, **kwargs):
        if value and isinstance(value, datetime) and value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return super()._serialize(value, *args, **kwargs)
