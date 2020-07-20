from flask import request
from werkzeug.exceptions import BadRequest, Conflict

from plugin_engine import hooks

from model import db, File
from model.file import EmptyFileError
from model.object import ObjectTypeConflictError

from schema.file import (
    FileCreateRequestSchema,
    FileLegacyCreateRequestSchema,
    FileListResponseSchema,
    FileItemResponseSchema
)

from . import logger, requires_authorization, deprecated
from .object import (
    list_objects, get_object_creation_params, get_object,
    ObjectResource, ObjectsResource
)


class FilesResource(ObjectsResource):
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
                    schema: FileListResponseSchema
            400:
                description: When wrong parameters were provided or syntax error occured in Lucene query
            404:
                description: When user doesn't have access to the `older_than` object
        """
        return list_objects(File, FileListResponseSchema, "files")

    @requires_authorization
    def post(self):
        """
        ---
        summary: Upload file
        description: Uploads new file.
        security:
            - bearerAuth: []
        tags:
            - file
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
                    options:
                      type: object
                      description: |
                        Additional upload options
                      properties:
                        parent:
                          type: string
                        metakeys:
                          type: array
                          items:
                            $ref: '#/components/schemas/MetakeyItemRequest'
                        upload_as:
                          type: string
                      schema: ObjectCreateRequestSchemaBase
                  required:
                    - file
        responses:
            200:
                description: Information about uploaded file
                content:
                  application/json:
                    schema: FileItemResponseSchema
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
        schema = FileCreateRequestSchema()
        params = schema.load(request.form.to_dict())

        if params and params.errors:
            return {"errors": params.errors}, 400

        parent, share_with, metakeys = get_object_creation_params(params.data["options"])

        try:
            file, is_new = File.get_or_create(
                request.files['file'],
                parent=parent,
                share_with=share_with,
                metakeys=metakeys
            )
            db.session.commit()
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a file")
        except EmptyFileError:
            raise BadRequest("File cannot be empty")

        if is_new:
            hooks.on_created_object(file)
            hooks.on_created_file(file)
        else:
            hooks.on_reuploaded_object(file)
            hooks.on_reuploaded_file(file)

        logger.info(
            "File added", extra={
                'sha256': file.sha256,
                'is_new': is_new
            }
        )
        schema = FileItemResponseSchema()
        return schema.dump(file)


class FileResource(ObjectResource):
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
                    schema: FileItemResponseSchema
            404:
                description: When file doesn't exist, object is not a file or user doesn't have access to this object.
        """
        return get_object(
            object_type=File,
            object_identifier=identifier,
            response_schema=FileItemResponseSchema
        )

    @deprecated
    @requires_authorization
    def post(self, identifier):
        """
        ---
        summary: Upload file (deprecated)
        description: Uploads new file.
        security:
            - bearerAuth: []
        tags:
            - deprecated
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
                    metakeys:
                      type: object
                      properties:
                          metakeys:
                            type: array
                            items:
                                $ref: '#/components/schemas/MetakeyItemRequest'
                      description: |
                        Attributes to be added after file upload

                        User must be allowed to set specified attribute keys.
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
                    schema: FileItemResponseSchema
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
        schema = FileLegacyCreateRequestSchema()
        params = schema.load(request.form.to_dict())

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
            file, is_new = File.get_or_create(
                request.files['file'],
                parent=parent,
                share_with=share_with,
                metakeys=metakeys
            )
            db.session.commit()
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a file")
        except EmptyFileError:
            raise BadRequest("File cannot be empty")

        if is_new:
            hooks.on_created_object(file)
            hooks.on_created_file(file)
        else:
            hooks.on_reuploaded_object(file)
            hooks.on_reuploaded_file(file)

        logger.info(
            "File added", extra={
                'sha256': file.sha256,
                'is_new': is_new
            }
        )
        schema = FileItemResponseSchema()
        return schema.dump(file)
