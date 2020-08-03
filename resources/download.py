from flask import send_file
from flask_restful import Resource
from werkzeug.exceptions import Forbidden, NotFound

from core.app import api
from model import File
from schema.download import DownloadURLResponseSchema

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
        return send_file(file_obj.get_path(), attachment_filename=file_obj.sha256, as_attachment=True)


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
        url = api.url_for(DownloadResource, access_token=download_token.decode())
        return schema.dump({"url": url})
