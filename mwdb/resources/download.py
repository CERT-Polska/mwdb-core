from flask import send_file, Response, stream_with_context
from flask_restful import Resource
import io
from werkzeug.exceptions import Forbidden, NotFound

from mwdb.core.app import api
from mwdb.core.config import app_config, StorageProviderType
from mwdb.core.util import get_minio_client
from mwdb.model import File
from mwdb.schema.download import DownloadURLResponseSchema

from . import requires_authorization


class DownloadResource(Resource):
    def get(self, access_token):
        """
        ---
        summary: Download file
        description: |
            Returns file contents based on provided file download token.
        security:
            - bearerAuth: []
        tags:
            - download
        parameters:
            - in: path
              name: access_token
              schema:
                type: string
              required: true
              description: File download token
        responses:
            200:
                description: File contents
                content:
                  application/octet-stream:
                    schema:
                      type: string
                      format: binary
            403:
                description: When file download token is no longer valid
        """
        file_obj = File.get_by_download_token(access_token)
        if not file_obj:
            raise Forbidden('Download token expired, please re-request download.')

        if app_config.mwdb.storage_provider == StorageProviderType.BLOB:
            try:
                resp = get_minio_client(
                    app_config.mwdb.blob_storage_endpoint,
                    app_config.mwdb.blob_storage_access_key,
                    app_config.mwdb.blob_storage_secret_key,
                    app_config.mwdb.blob_storage_region_name,
                    app_config.mwdb.blob_storage_secure,
                ).get_object(app_config.mwdb.blob_storage_bucket_name, file_obj.get_path())
                
                def chunker(r):
                    for chunk in r.stream(1024*256):
                        print("chunker")
                        print(len(chunk))
                        yield chunk

                return Response(
                    chunker(resp),
                    content_type='application/octet-stream',
                    headers={"Content-disposition":"attachment; filename={}".format(file_obj.sha256)}
                )
            finally:
                resp.close()
                resp.release_conn()
        else:
            file_to_send = file_obj.get_path()
            return send_file(file_to_send, attachment_filename=file_obj.sha256, as_attachment=True)


class RequestSampleDownloadResource(Resource):
    @requires_authorization
    def post(self, identifier):
        """
        ---
        summary: Get file download URL
        description: |
            Returns download URL for given file.
        security:
            - bearerAuth: []
        tags:
            - download
        parameters:
            - in: path
              name: identifier
              description: Requested file identifier (SHA256/MD5/SHA1/SHA512)
              schema:
                type: string
        responses:
            200:
                description: Absolute download URL for the sample, valid for 60 seconds
                content:
                  application/json:
                    schema: DownloadURLResponseSchema
            404:
                description: When file doesn't exist, object is not a file or user doesn't have access to this object.
        """
        file = File.access(identifier)
        if file is None:
            raise NotFound("Object not found")

        download_token = file.generate_download_token()
        schema = DownloadURLResponseSchema()
        url = api.relative_url_for(DownloadResource, access_token=download_token.decode())
        return schema.dump({"url": url})
