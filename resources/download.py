from flask import current_app, send_file
from flask_restful import Resource
from itsdangerous import TimedJSONWebSignatureSerializer, BadSignature, SignatureExpired
from werkzeug.exceptions import Forbidden

from model import File
from core.config import app_config
from core.schema import URLReturnSchema
from core.util import get_sample_path

from . import authenticated_access, requires_authorization


class DownloadResource(Resource):
    def get(self, access_token):
        """
        ---
        description: Download file using previously obtained access token
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
              description: Access token obtained from /request/*
        responses:
            200:
                description: File contents
                content:
                  application/octet-stream:
                    schema:
                      type: string
                      format: binary
            403:
                description: When access token is not valid
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
        description: Request download URL for given sample
        security:
            - bearerAuth: []
        tags:
            - download
        parameters:
            - in: path
              name: identifier
              description: SHA256 or MD5 of requested file
              schema:
                type: string
        responses:
            200:
                description: Absolute download URL for the sample, valid for 60 seconds
                content:
                  application/json:
                    schema: URLReturnSchema
            404:
                description: When file doesn't exist
        """
        from core.service import get_url_for
        file = authenticated_access(File, identifier)
        s = TimedJSONWebSignatureSerializer(app_config.malwarecage.secret_key, expires_in=60)
        obj = s.dumps({'identifier': file.sha256})

        schema = URLReturnSchema()
        url = get_url_for(current_app, DownloadResource, access_token=obj.decode("utf-8"))
        return schema.dump({"url": url})
