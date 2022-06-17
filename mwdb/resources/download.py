from flask import Response
from flask_restful import Resource
from werkzeug.exceptions import Forbidden, NotFound

from mwdb.core.app import api
from mwdb.core.rate_limit import rate_limited_resource
from mwdb.model import File
from mwdb.schema.download import DownloadURLResponseSchema

from . import deprecated, requires_authorization


@rate_limited_resource
class DownloadResource(Resource):
    @deprecated
    def get(self, access_token):
        """
        ---
        summary: Download file
        description: |
            Returns file contents based on provided file download token.

            Deprecated: use GET /file/{identifier}/download instead.
        deprecated: true
        tags:
            - file
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
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        file_obj = File.get_by_download_token(access_token)
        if not file_obj:
            raise Forbidden("Download token expired, please re-request download.")

        return Response(
            file_obj.iterate(),
            content_type="application/octet-stream",
            headers={"Content-disposition": f"attachment; filename={file_obj.sha256}"},
        )


@rate_limited_resource
class RequestSampleDownloadResource(Resource):
    @deprecated
    @requires_authorization
    def post(self, identifier):
        """
        ---
        summary: Get file download URL
        description: |
            Returns download URL for given file.

            Deprecated: use POST /file/{identifier}>/download instead.
        security:
            - bearerAuth: []
        deprecated: true
        tags:
            - file
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
                description: |
                    When file doesn't exist, object is not a file
                    or user doesn't have access to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        file = File.access(identifier)
        if file is None:
            raise NotFound("Object not found")

        download_token = file.generate_download_token()
        schema = DownloadURLResponseSchema()
        url = api.relative_url_for(DownloadResource, access_token=download_token)
        return schema.dump({"url": url})
