from flask_restful import Resource
import urllib3
from werkzeug.exceptions import BadRequest, Conflict
from mwdb.core.config import app_config
from mwdb.schema.remotes import APIRemotesListResponseSchema
from mwdb.model import File
from mwdb.model.file import EmptyFileError
from mwdb.model.object import ObjectTypeConflictError
import json
from tempfile import SpooledTemporaryFile


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


class APiRemotesFilePullResource(Resource):
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
        response = self.session.request("GET", f"{remote_url}/api/file/{identifier}",
                                        preload_content=False,
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})

        data = response.read()
        file_name = json.loads(data.decode('utf-8'))['file_name']

        response = self.session.request("POST", f"{remote_url}/api/request/sample/{identifier}",
                                        preload_content=False,
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})
        data = response.read()

        download_url = json.loads(data.decode('utf-8'))['url']
        response = self.session.request("GET", f"{remote_url}/api/{download_url}",
                                        preload_content=False,
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})
        file_stream = SpooledTemporaryFile()
        file_stream.write(response.read())
        file_stream.seek(0)
        try:
            return File.get_or_create(
                file_name,
                file_stream
            )
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a file")
        except EmptyFileError:
            raise BadRequest("File cannot be empty")
        finally:
            file_stream.close()
