from flask import request

from werkzeug.exceptions import Conflict

from plugin_engine import hooks

from model import db, TextBlob
from model.object import ObjectTypeConflictError

from core.capabilities import Capabilities

from schema.blob import (
    BlobCreateRequestSchema,
    BlobLegacyCreateRequestSchema,
    BlobListResponseSchema,
    BlobItemResponseSchema
)


from . import logger, requires_capabilities, requires_authorization, deprecated
from .object import (
    list_objects, get_object_creation_params, get_object,
    ObjectResource, ObjectsResource
)


class BlobsResource(ObjectsResource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: Search or list blobs
        description: |
            Returns list of text blobs matching provided query, ordered from the latest one.

            Limited to 10 objects, use `older_than` parameter to fetch more.

            Don't rely on maximum count of returned objects because it can be changed/parametrized in future.
        security:
            - bearerAuth: []
        tags:
            - blob
        parameters:
            - in: query
              name: older_than
              schema:
                type: string
              description: Fetch objects which are older than the object specified by identifier. Used for pagination
              required: false
            - in: query
              name: query
              schema:
                type: string
              description: Filter results using Lucene query
              required: false
        responses:
            200:
                description: List of text blobs
                content:
                  application/json:
                    schema: BlobListResponseSchema
            400:
                description: When wrong parameters were provided or syntax error occured in Lucene query
            404:
                description: When user doesn't have access to the `older_than` object
        """
        return list_objects(
            object_type=TextBlob,
            response_schema=BlobListResponseSchema,
            response_key="blobs"
        )

    @requires_authorization
    @requires_capabilities(Capabilities.adding_blobs)
    def post(self):
        """
        ---
        summary: Upload text blob
        description: |
            Uploads new text blob.

            Requires `adding_blobs` capability.
        security:
            - bearerAuth: []
        tags:
            - blob
        requestBody:
            required: true
            description: Text blob to be uploaded
            content:
              application/json:
                schema: BlobCreateRequestSchema
                examples:
                  simple:
                    summary: Simple blob upload
                    value:
                      blob_name: malwarex_blob123
                      blob_type: raw_cfg
                      content: "blob contents"
                  full:
                    summary: Fully-featured configuration upload
                    value:
                      blob_name: malwarex_blob123
                      blob_type: raw_cfg
                      content: "blob contents"
                      parent: null
                      upload_as: "*"
                      metakeys:
                       key: value
        responses:
            200:
                description: Text blob uploaded succesfully
                content:
                  application/json:
                    schema: BlobItemResponseSchema
            403:
                description: No permissions to perform additional operations (e.g. adding metakeys)
            404:
                description: Specified group doesn't exist
            409:
                description: Object exists yet but has different type
        """
        schema = BlobCreateRequestSchema()
        params = schema.loads(request.get_data(as_text=True))

        if params and params.errors:
            return {"errors": params.errors}, 400

        parent, share_with, metakeys = get_object_creation_params(params.data)

        try:
            blob, is_new = TextBlob.get_or_create(
                params.data["content"],
                params.data["blob_name"],
                params.data["blob_type"],
                parent=parent,
                share_with=share_with,
                metakeys=metakeys
            )
            db.session.commit()
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a blob")

        if is_new:
            hooks.on_created_object(blob)
            hooks.on_created_text_blob(blob)
        else:
            hooks.on_reuploaded_object(blob)
            hooks.on_reuploaded_text_blob(blob)

        logger.info(
            "Blob added", extra={
                'dhash': blob.dhash,
                'is_new': is_new
            }
        )
        schema = BlobItemResponseSchema()
        return schema.dump(blob)


class BlobResource(ObjectResource):
    @requires_authorization
    def get(self, identifier):
        """
        ---
        summary: Get blob
        description: |
            Returns text blob information and contents
        security:
            - bearerAuth: []
        tags:
            - blob
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: Blob identifier
        responses:
            200:
                description: Blob information and contents
                content:
                  application/json:
                    schema: BlobItemResponseSchema
            404:
                description: When blob doesn't exist, object is not a blob or user doesn't have access to this object.
        """
        return get_object(
            object_type=TextBlob,
            object_identifier=identifier,
            response_schema=BlobItemResponseSchema
        )

    @deprecated
    @requires_authorization
    @requires_capabilities(Capabilities.adding_blobs)
    def put(self, identifier):
        """
        ---
        summary: Upload text blob (deprecated)
        description: |
            Uploads new text blob.

            Requires `adding_blobs` capability.
        security:
            - bearerAuth: []
        tags:
            - deprecated
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: Parent object unique identifier
        requestBody:
            required: true
            description: Text blob to be uploaded
            content:
              application/json:
                schema: BlobLegacyCreateRequestSchema
        responses:
            200:
                description: Text blob uploaded succesfully
                content:
                  application/json:
                    schema: BlobItemResponseSchema
            403:
                description: No permissions to perform additional operations (e.g. adding metakeys)
            404:
                description: Specified group doesn't exist
            409:
                description: Object exists yet but has different type
        """
        schema = BlobLegacyCreateRequestSchema()
        params = schema.loads(request.get_data(as_text=True))

        if params and params.errors:
            return {"errors": params.errors}, 400

        params_data = dict(params.data)

        if params_data["metakeys"]:
            params_data["metakeys"] = params_data["metakeys"]["metakeys"]
        else:
            params_data["metakeys"] = []

        if identifier != "root":
            params_data["parent"] = identifier
        else:
            params_data["parent"] = None

        parent, share_with, metakeys = get_object_creation_params(params_data)

        try:
            blob, is_new = TextBlob.get_or_create(
                params.data["content"],
                params.data["blob_name"],
                params.data["blob_type"],
                parent=parent,
                share_with=share_with,
                metakeys=metakeys
            )
            db.session.commit()
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a blob")

        if is_new:
            hooks.on_created_object(blob)
            hooks.on_created_text_blob(blob)
        else:
            hooks.on_reuploaded_object(blob)
            hooks.on_reuploaded_text_blob(blob)

        logger.info(
            "Blob added", extra={
                'dhash': blob.dhash,
                'is_new': is_new
            }
        )
        schema = BlobItemResponseSchema()
        return schema.dump(blob)
