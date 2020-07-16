from flask import request
from werkzeug.exceptions import BadRequest, Conflict

from plugin_engine import hooks

from model import File
from model.file import EmptyFileError
from model.object import ObjectTypeConflictError

from core.schema import FileShowSchema, MultiFileShowSchema

from . import requires_authorization
from .object import ObjectResource, ObjectListResource


class FileListResource(ObjectListResource):
    ObjectType = File
    Schema = MultiFileShowSchema
    SchemaKey = "files"

    @requires_authorization
    def get(self):
        """
        ---
        summary: Search or list files
        description: |
            Returns a list of files matching provided query, ordered from the latest one.

            Limited to 10 objects, use `older_than` parameter to fetch more.

            Don't rely on maximum count of returned objects because it can be changed/parametrized in future.
        security:
            - bearerAuth: []
        tags:
            - file
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
                description: List of files
                content:
                  application/json:
                    schema: MultiFileShowSchema
            400:
                description: When wrong parameters were provided or syntax error occured in Lucene query
            404:
                description: When user doesn't have access to the `older_than` object
        """
        return super(FileListResource, self).get()


class FileResource(ObjectResource):
    ObjectType = File
    ObjectTypeStr = File.__tablename__
    Schema = FileShowSchema
    on_created = hooks.on_created_file
    on_reuploaded = hooks.on_reuploaded_file

    @requires_authorization
    def get(self, identifier):
        """
        ---
        summary: Get file information
        description: |
            Returns information about file.
        security:
            - bearerAuth: []
        tags:
            - file
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: File identifier (SHA256/SHA512/SHA1/MD5)
        responses:
            200:
                description: Information about file
                content:
                  application/json:
                    schema: FileShowSchema
            404:
                description: When file doesn't exist, object is not a file or user doesn't have access to this object.
        """
        return super(FileResource, self).get(identifier)

    def create_object(self, obj):
        try:
            return File.get_or_create(request.files["file"])
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a file")
        except EmptyFileError:
            raise BadRequest("File cannot be empty")

    @requires_authorization
    def post(self, identifier):
        """
        ---
        summary: Upload file
        description: Uploads new file.
        security:
            - bearerAuth: []
        tags:
            - file
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              default: 'root'
              description: |
                Parent object identifier or `root` if there is no parent.

                User must have `adding_parents` capability to specify a parent object.
        requestBody:
            required: true
            content:
              multipart/form-data:
                schema:
                  type: object
                  properties:
                    file:
                      type: string
                      format: binary
                      description: File contents to be uploaded
                    json:
                      type: string
                      description: |
                        Additional JSON-encoded information about object (ignored for files)
                    metakeys:
                      type: string
                      description: |
                        Optional JSON-encoded `MetakeyShowSchema`. User must be allowed to set specified attribute keys.
                    upload_as:
                      type: string
                      default: '*'
                      description: |
                        Group that object will be shared with. If user doesn't have `sharing_objects` capability,
                        user must be a member of specified group (unless `Group doesn't exist` error will occur).
                        If default value `*` is specified - object will be exclusively shared with all user's groups
                        excluding `public`.
                  required:
                    - file
        responses:
            200:
                description: Information about uploaded file
                content:
                  application/json:
                    schema: FileShowSchema
            403:
                description: No permissions to perform additional operations (e.g. adding parent, metakeys)
            404:
                description: |
                    One of attribute keys doesn't exist or user doesn't have permission to set it.

                    Specified `upload_as` group doesn't exist or user doesn't have permission to share objects
                    with that group
            409:
                description: Object exists yet but has different type
        """
        return super(FileResource, self).post(identifier)
