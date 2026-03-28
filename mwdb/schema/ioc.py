from marshmallow import Schema, ValidationError, fields, pre_load, validates

IOC_TYPES = ["ip", "domain", "url", "port", "email", "hash"]
IOC_SEVERITIES = ["low", "medium", "high", "critical"]


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

    @pre_load
    def sanitize(self, params, **kwargs):
        params = dict(params)
        if params.get("type"):
            params["type"] = params["type"].lower().strip()
        if params.get("value"):
            params["value"] = params["value"].strip()
        if params.get("severity"):
            params["severity"] = params["severity"].lower().strip()
        if params.get("category"):
            params["category"] = params["category"].lower().strip()
        return params

    @validates("type")
    def validate_type(self, value):
        if not value:
            raise ValidationError("IOC type shouldn't be empty")
        if value not in IOC_TYPES:
            raise ValidationError(
                f"Invalid IOC type '{value}'. "
                f"Must be one of: {', '.join(IOC_TYPES)}"
            )

    @validates("value")
    def validate_value(self, value):
        if not value:
            raise ValidationError("IOC value shouldn't be empty")

    @validates("severity")
    def validate_severity(self, value):
        if value is not None and value not in IOC_SEVERITIES:
            raise ValidationError(
                f"Invalid severity '{value}'. "
                f"Must be one of: {', '.join(IOC_SEVERITIES)}"
            )


class IOCUpdateRequestSchema(Schema):
    category = fields.Str(missing=None, allow_none=True)
    severity = fields.Str(missing=None, allow_none=True)
    tags = fields.List(fields.Str(), missing=None, allow_none=True)

    @pre_load
    def sanitize(self, params, **kwargs):
        params = dict(params)
        if params.get("severity"):
            params["severity"] = params["severity"].lower().strip()
        if params.get("category"):
            params["category"] = params["category"].lower().strip()
        return params

    @validates("severity")
    def validate_severity(self, value):
        if value is not None and value not in IOC_SEVERITIES:
            raise ValidationError(
                f"Invalid severity '{value}'. "
                f"Must be one of: {', '.join(IOC_SEVERITIES)}"
            )


class IOCItemResponseSchema(Schema):
    id = fields.Int(required=True)
    type = fields.Str(required=True)
    value = fields.Str(required=True)
    category = fields.Str(allow_none=True)
    severity = fields.Str(allow_none=True)
    tags = fields.List(fields.Str())
    creation_time = fields.DateTime(format="iso")
