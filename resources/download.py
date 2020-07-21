from flask import current_app, send_file
from flask_restful import Resource
from itsdangerous import TimedJSONWebSignatureSerializer, BadSignature, SignatureExpired
from werkzeug.exceptions import Forbidden, NotFound

from model import File
from core.config import app_config
from core.schema import URLReturnSchema
from core.util import get_sample_path

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
                description: When file download token is not valid
        """
        s = TimedJSONWebSignatureSerializer(app_config.malwarecage.secret_key)
        try:
            download_req = s.loads(access_token)
        except SignatureExpired:
            raise Forbidden('Download URL valid but expired, please re-request download.')
        except BadSignature:
            raise Forbidden('Invalid download URL.')

        sample_sha256 = download_req['identifier']
        return send_file(get_sample_path(sample_sha256), attachment_filename=sample_sha256, as_attachment=True)


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
                    schema: URLReturnSchema
            404:
                description: When file doesn't exist, object is not a file or user doesn't have access to this object.
        """
        from core.service import get_url_for

        file = File.access(identifier)
        if file is None:
            raise NotFound("Object not found")

        s = TimedJSONWebSignatureSerializer(app_config.malwarecage.secret_key, expires_in=60)
        obj = s.dumps({'identifier': file.sha256})

        schema = URLReturnSchema()
        url = get_url_for(current_app, DownloadResource, access_token=obj.decode("utf-8"))
        return schema.dump({"url": url})
