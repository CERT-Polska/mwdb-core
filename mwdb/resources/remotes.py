from flask_restful import Resource
import urllib3
from mwdb.core.config import app_config
from mwdb.schema.remotes import APIRemotesListResponseSchema
import json
from mwdb.resources.object import ObjectResource, ObjectUploader
from mwdb.resources.file import FileUploader
import os
from mwdb.model.object import ObjectTypeConflictError
from mwdb.resources.config import ConfigUploader
from mwdb.resources.blob import TextBlobUploader
from mwdb.schema.file import FileCreateRequestSchema
from mwdb.schema.config import ConfigCreateRequestSchema
from mwdb.schema.blob import BlobCreateRequestSchema
from . import requires_authorization, load_schema


class APIRemotesListResource(Resource):
    # @requires_authorization
    def get(self):
        """
        ---
        summary: Get list of configured remote names
        description: |
            Return a list of available remote names
        tags:
            - api_remote
        responses:
            description: List of user configured remotes
            content:
              application/json:
                schema: GroupListResponseSchema
        """
        remotes = app_config.mwdb.remotes
        schema = APIRemotesListResponseSchema()
        return schema.dump({"remotes": remotes})


# class RemoteFileUploader(ObjectUploader):
#     def _create_object(self, spec, parent, share_with, metakeys):
#         try:
#             return File.get_or_create(
#                 request.files["file"],
#                 parent=parent,
#                 share_with=share_with,
#                 metakeys=metakeys
#             )
#         except ObjectTypeConflictError:
#             raise Conflict("Object already exists and is not a file")
#         except EmptyFileError:
#             raise BadRequest("File cannot be empty")


class APiRemotesFilePullResource(FileUploader, ObjectResource):
    session = urllib3.PoolManager()

    # @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Pulls object from remote to local instance
        description: |
            Pulls object from the remote instance to the local instance
        tags:
            - api_remote
        parameters:
            - in: path
              name: remote_name
              description: name of remote
              schema:
                type: string
            - in: path
              name: identifier
              description: Object identifier (SHA256/SHA512/SHA1/MD5)
              schema:
                type: string
        responses:
            description: Return information about pulled object
        """
        remote_url = app_config.get_key(f"remote:{remote_name}", "url")
        api_key = app_config.get_key(f"remote:{remote_name}", "api_key")
        response = self.session.request("POST", f"{remote_url}/api/request/sample/{identifier}",
                                        preload_content=False,
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})
        data = response.read()

        obj_json = json.loads(data.decode('utf-8'))
        response = self.session.request("GET", f"{remote_url}/api/{obj_json['url']}",
                                        preload_content=False,
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})
        obj = response.read()
