from werkzeug.exceptions import Conflict

from plugin_engine import hooks

from core.capabilities import Capabilities
from core.schema import TextBlobShowSchema, MultiTextBlobSchema

from model import TextBlob
from model.object import ObjectTypeConflictError

from . import requires_capabilities, requires_authorization
from .object import ObjectResource, ObjectListResource


class TextBlobListResource(ObjectListResource):
    ObjectType = TextBlob
    Schema = MultiTextBlobSchema
    SchemaKey = "blobs"

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
                    schema: MultiTextBlobSchema
            400:
                description: When wrong parameters were provided or syntax error occured in Lucene query
            404:
                description: When user doesn't have access to the `older_than` object
        """
        return super(TextBlobListResource, self).get()


class TextBlobResource(ObjectResource):
    ObjectType = TextBlob
    ObjectTypeStr = TextBlob.__tablename__
    Schema = TextBlobShowSchema
    on_created = hooks.on_created_text_blob
    on_reuploaded = hooks.on_reuploaded_text_blob

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
            - config
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
                    schema: TextBlobShowSchema
            404:
                description: When blob doesn't exist, object is not a blob or user doesn't have access to this object.
        """
        return super(TextBlobResource, self).get(identifier)

    def create_object(self, obj):
        try:
            return TextBlob.get_or_create(
                obj.data["content"],
                obj.data["blob_name"],
                obj.data["blob_type"]
            )
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a blob")

    @requires_authorization
    @requires_capabilities(Capabilities.adding_blobs)
    def put(self, identifier):
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
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: Parent object unique identifier
        requestBody:
            required: true
            content:
              multipart/form-data:
                schema:
                  type: object
                  description: Uploaded text blob parameters (verbose mode)
                  properties:
                    json:
                      type: string
                      format: binary
                      description: Text blob to be uploaded
                    metakeys:
                      type: string
                      description: Optional JSON-encoded `MetakeyShowSchema` (only for permitted users)
                    upload_as:
                      type: string
                      default: '*'
                      description: Identity used for uploading sample
                  required:
                    - json
              application/json:
                schema:
                  type: object
                  description: Text blob to be uploaded (simple mode)
                  properties:
                    content:
                      type: string
                      description: Text blob content
                    blob_name:
                      type: string
                      description: Name of blob object
                    blob_type:
                      type: string
                      description: Config type (static, dynamic, other)
                  required:
                    - content
                    - blob_name
                    - blob_type
        responses:
            200:
                description: Text blob uploaded succesfully
                content:
                  application/json:
                    schema: TextBlobShowSchema
            403:
                description: No permissions to perform additional operations (e.g. adding metakeys)
            404:
                description: Specified group doesn't exist
            409:
                description: Object exists yet but has different type
        """
        return super(TextBlobResource, self).put(identifier)
