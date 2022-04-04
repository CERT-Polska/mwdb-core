from flask import request
from flask_restful import Resource
from werkzeug.exceptions import BadRequest, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.rate_limit import rate_limited_resource
from mwdb.model import KartonAnalysis, Object
from mwdb.schema.karton import (
    KartonItemResponseSchema,
    KartonListResponseSchema,
    KartonSubmitAnalysisRequestSchema,
)

from . import (
    access_object,
    is_valid_uuid,
    loads_schema,
    logger,
    requires_authorization,
    requires_capabilities,
)


@rate_limited_resource
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
            - karton
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
                description: Information about analysis status
                content:
                  application/json:
                    schema: KartonListResponseSchema
            404:
                description: |
                    When object doesn't exist or user doesn't have access
                    to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        status = db_object.get_analysis_status()
        schema = KartonListResponseSchema()
        return schema.dump({"status": status, "analyses": db_object.analyses})

    @requires_authorization
    @requires_capabilities(Capabilities.karton_reanalyze)
    def post(self, type, identifier):
        """
        ---
        summary: Resubmit object to Karton
        description: |
            Submits object into Karton to trigger new analysis

            If submit was successful: returns information about
            spawned Karton analyses for provided object

            Requires `karton_reanalyze` capability.
        security:
            - bearerAuth: []
        tags:
            - karton
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
        requestBody:
            description: Karton analysis arguments (optional)
            content:
              application/json:
                schema: KartonSubmitAnalysisRequestSchema
        responses:
            200:
                description: Information about analysis status
                content:
                  application/json:
                    schema: KartonItemResponseSchema
            403:
                description: When user doesn't have `karton_reanalyze` capability.
            404:
                description: |
                    When object doesn't exist or user doesn't have access
                    to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        schema = KartonSubmitAnalysisRequestSchema()
        obj = loads_schema(request.get_data(as_text=True) or "{}", schema)

        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        analysis = db_object.spawn_analysis(obj["arguments"])
        schema = KartonItemResponseSchema()
        return schema.dump(analysis)


@rate_limited_resource
class KartonAnalysisResource(Resource):
    @requires_authorization
    def get(self, type, identifier, analysis_id):
        """
        ---
        summary: Get information about Karton analysis
        description: |
            Returns information about Karton analysis
        security:
            - bearerAuth: []
        tags:
            - karton
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
            - in: path
              name: analysis_id
              schema:
                type: string
              description: Analysis identifier
        responses:
            200:
                description: Information about analysis status
                content:
                  application/json:
                    schema: KartonItemResponseSchema
            404:
                description: |
                    When object doesn't exist or user doesn't have access
                    to this object.

                    When analysis doesn't exist or is not associated with
                    the object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        analysis = (
            KartonAnalysis.get(analysis_id)
            .join(KartonAnalysis.objects)
            .filter(Object.id == db_object.id)
        ).first()
        if analysis is None:
            raise NotFound("Analysis not found or not associated with the object")

        schema = KartonItemResponseSchema()
        return schema.dump(analysis)

    @requires_authorization
    @requires_capabilities(Capabilities.karton_assign)
    def put(self, type, identifier, analysis_id):
        """
        ---
        summary: Assign Karton analysis to the object
        description: |
            Assigns new or existing Karton analysis to the object

            Requires `karton_assign` capability.
        security:
            - bearerAuth: []
        tags:
            - karton
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
            - in: path
              name: analysis_id
              schema:
                type: string
              description: Analysis identifier
        responses:
            200:
                description: Information about analysis status
                content:
                  application/json:
                    schema: KartonItemResponseSchema
            400:
                description: When analysis_id is not UUID value
            403:
                description: When user doesn't have `karton_assign` capability.
            404:
                description: |
                    When object doesn't exist or user doesn't have access
                    to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        if not is_valid_uuid(analysis_id):
            raise BadRequest("'karton' attribute accepts only UUID values")

        analysis, _ = db_object.assign_analysis(analysis_id)
        schema = KartonItemResponseSchema()
        return schema.dump(analysis)

    @requires_authorization
    @requires_capabilities(Capabilities.karton_unassign)
    def delete(self, type, identifier, analysis_id):
        """
        ---
        summary: Remove Karton analysis from the object
        description: |
            Remove existing Karton analysis from the object

            Requires `karton_unassign` capability.
        security:
            - bearerAuth: []
        tags:
            - karton
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
            - in: path
              name: analysis_id
              schema:
                type: string
              description: Analysis identifier
        responses:
            200:
                description: When analysis was successfully removed from object
            400:
                description: When analysis_id is not UUID value
            403:
                description: When user doesn't have `karton_unassign` capability.
            404:
                description: |
                    When object or analysis doesn't exist, user doesn't have access
                    to this object or analysis is not assigned to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        if not is_valid_uuid(analysis_id):
            raise BadRequest("'karton' attribute accepts only UUID values")

        result = db_object.remove_analysis(analysis_id)
        if result:
            logger.info(
                "Analysis removed from object",
                extra={"object": db_object.dhash, "analysis id": analysis_id},
            )
        else:
            raise NotFound("Analysis not found")
