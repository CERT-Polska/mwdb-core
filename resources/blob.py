import hashlib
from datetime import datetime

from flask import g

from plugin_engine import hooks
from model import db, TextBlob
from core.capabilities import Capabilities
from core.config import app_config
from core.schema import TextBlobShowSchema, MultiTextBlobSchema

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
        description: Retrieve list of text blobs
        security:
            - bearerAuth: []
        tags:
            - config
        parameters:
            - in: query
              name: older_than
              schema:
                type: string
              description: Fetch blobs which are older than the blob specified by identifier. Used for pagination
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
                description: Syntax error in Lucene query
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
        description: Fetch text blob information by hash
        security:
            - bearerAuth: []
        tags:
            - blob
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: Text blob unique identifier
        responses:
            200:
                description: When text blob was found
                content:
                  application/json:
                    schema: TextBlobShowSchema
            404:
                description: When object was not found
        """
        return super(TextBlobResource, self).get(identifier)

    def create_object(self, obj):
        content = obj.data.get('content')

        dhash = hashlib.sha256(content.encode('utf-8')).hexdigest()

        db_blob = TextBlob()
        db_blob.blob_name = obj.data.get("blob_name")
        db_blob.content = content
        db_blob.blob_size = len(content)
        db_blob.blob_type = obj.data.get('blob_type')
        db_blob.dhash = dhash
        db_blob.upload_time = datetime.now()
        db_blob.last_seen = datetime.now()

        if app_config.malwarecage.enable_maintenance and g.auth_user.login == app_config.malwarecage.admin_login:
            db_blob.upload_time = obj.data.get("upload_time", datetime.now())

        db_blob, is_blob_new = TextBlob.get_or_create(db_blob)

        if not is_blob_new:
            db_blob.last_seen = datetime.now()
            db.session.add(db_blob)
            db.session.commit()

        return db_blob, is_blob_new

    @requires_authorization
    @requires_capabilities(Capabilities.adding_blobs)
    def put(self, identifier):
        """
        ---
        description: Upload text blob
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
