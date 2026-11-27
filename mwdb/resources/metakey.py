from flask import g, request
from werkzeug.exceptions import Forbidden, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.deprecated import DeprecatedFeature, deprecated_endpoint
from mwdb.core.service import Resource
from mwdb.schema.metakey import (
    MetakeyListRequestSchema,
    MetakeyListResponseSchema,
)

from . import (
    access_object,
    load_schema,
    requires_authorization,
)


class MetakeyResource(Resource):
    @deprecated_endpoint(DeprecatedFeature.legacy_metakey_api)
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object attributes
        description: |
            Returns all attributes of specified object that user is allowed to read.

            Deprecated: use Attributes API instead
        security:
            - bearerAuth: []
        deprecated: true
        tags:
            - metakey
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of object
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
            - in: query
              name: hidden
              schema:
                type: int
              description: |
                Show hidden attributes
                (requires `reading_all_attributes` capability)
              required: false
        responses:
            200:
                description: Object attributes
                content:
                  application/json:
                    schema: MetakeyListResponseSchema
            403:
                description: |
                    When user requested hidden metakeys
                    but doesn't have `reading_all_attributes` capability
            404:
                description: |
                    When object doesn't exist or user doesn't have
                    access to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        schema = MetakeyListRequestSchema()
        obj = load_schema(request.args, schema)

        show_hidden = obj["hidden"]
        if show_hidden and not g.auth_user.has_rights(
            Capabilities.reading_all_attributes
        ):
            raise Forbidden("You are not permitted to read hidden metakeys")

        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        metakeys = db_object.get_attributes(show_hidden=show_hidden)
        schema = MetakeyListResponseSchema()
        return schema.dump({"metakeys": metakeys})
