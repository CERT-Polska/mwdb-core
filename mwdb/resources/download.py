import boto3
from botocore.client import Config as BotoConfig
from flask import send_file
from flask_restful import Resource
import io
from werkzeug.exceptions import Forbidden, NotFound

from mwdb.core.app import api
from mwdb.core.config import app_config, StorageProviderType
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
            s3 = boto3.resource('s3',
                endpoint_url=app_config.mwdb.blob_storage_endpoint,
                aws_access_key_id=app_config.mwdb.blob_storage_access_key,
                aws_secret_access_key=app_config.mwdb.blob_storage_secret_key,
                config=BotoConfig(signature_version='s3v4'),
                region_name=app_config.mwdb.blob_storage_region_name)

            file_to_send = io.BytesIO()
            s3_object = s3.Bucket(app_config.mwdb.blob_storage_bucket_name).Object(file_obj.get_path())
            s3_object.download_fileobj(file_to_send)
            file_to_send.seek(0)
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
