import json
from uuid import UUID

from flask import g, request
from flask_restful import Resource
from luqum.parser import ParseError
from werkzeug.exceptions import BadRequest, Forbidden, MethodNotAllowed, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.plugins import hooks
from mwdb.core.search import SQLQueryBuilder, SQLQueryBuilderBaseException
from mwdb.model import MetakeyDefinition, Object, db
from mwdb.model.karton import KartonAnalysis
from mwdb.schema.object import (
    ObjectCountRequestSchema,
    ObjectCountResponseSchema,
    ObjectItemResponseSchema,
    ObjectListRequestSchema,
    ObjectListResponseSchema,
)

from . import (
    access_object,
    get_shares_for_upload,
    get_type_from_str,
    load_schema,
    logger,
    requires_authorization,
    requires_capabilities,
)


class KartonObjectResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object analyses
        description: |
            Returns information about spawned Karton analyses
            for provided object
        security:
            - bearerAuth: []
        tags:
            - object
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of target object
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
        responses:
            200:
                description: Information about object
                content:
                  application/json:
                    schema: ObjectItemResponseSchema
            404:
                description: |
                    When object doesn't exist or user doesn't have access
                    to this object.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")


class KartonAnalysisResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        pass

    @requires_authorization
    def put(self, type, identifier):
        pass
