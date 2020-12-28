from flask_restful import Resource
from flask import g
import urllib3
from mwdb.core.plugins import hooks
from werkzeug.exceptions import BadRequest, Conflict , NotFound, Forbidden
from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.schema.remotes import APIRemotesListResponseSchema
from mwdb.model import db, File, Config, TextBlob
from mwdb.model.file import EmptyFileError
from mwdb.model.object import ObjectTypeConflictError
from mwdb.schema.file import FileItemResponseSchema
from mwdb.schema.config import ConfigItemResponseSchema
from mwdb.schema.blob import BlobItemResponseSchema
import json
from tempfile import SpooledTemporaryFile
from . import logger, requires_authorization


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
    ObjectType = File
    on_created = hooks.on_created_file
    on_reuploaded = hooks.on_reuploaded_file

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
            200:
                description: Information about uploaded config
                content:
                  application/json:
                    schema: FileItemResponseSchema
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
            item, is_new = File.get_or_create(
                file_name,
                file_stream
            )
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a file")
        except EmptyFileError:
            raise BadRequest("File cannot be empty")
        finally:
            file_stream.close()

        try:
            db.session.commit()

            if is_new:
                hooks.on_created_object(item)
                self.on_created(item)
            else:
                hooks.on_reuploaded_object(item)
                self.on_reuploaded(item)
        finally:
            item.release_after_upload()

        logger.info(f'{self.ObjectType.__name__} added', extra={
            'dhash': item.dhash,
            'is_new': is_new
        })
        schema = FileItemResponseSchema()
        return schema.dump(item)


class APiRemotesConfigPullResource(Resource):
    session = urllib3.PoolManager()
    ObjectType = Config
    on_created = hooks.on_created_file
    on_reuploaded = hooks.on_reuploaded_file

    # @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Pulls config from remote to local instance
        description: |
            Pulls config from the remote instance to the local instance
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
              description: Config identifier
              schema:
                type: string
        responses:
            200:
                description: Information about pulled config
                content:
                  application/json:
                    schema: ConfigItemResponseSchema
        """
        remote_url = app_config.get_key(f"remote:{remote_name}", "url")
        api_key = app_config.get_key(f"remote:{remote_name}", "api_key")
        response = self.session.request("GET", f"{remote_url}/api/config/{identifier}",
                                        preload_content=False,
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})

        data = response.read()
        spec = json.loads(data.decode('utf-8'))
        try:
            config = dict(spec["cfg"])
            blobs = []
            for first, second in config.items():
                if isinstance(second, dict) and list(second.keys()) == ["in-blob"]:
                    if not g.auth_user.has_rights(Capabilities.adding_blobs):
                        raise Forbidden("You are not permitted to add blob objects")
                    in_blob = second["in-blob"]
                    if isinstance(in_blob, str):
                        blob_obj = TextBlob.access(in_blob)
                        if not blob_obj:
                            raise NotFound(f"Blob {in_blob} doesn't exist")
                    blobs.append(blob_obj)
                    config[first]["in-blob"] = blob_obj.dhash

                elif isinstance(second, dict) and ("in-blob" in list(second.keys())):
                    raise BadRequest("'in-blob' should be the only key")

            item, is_new = Config.get_or_create(
                spec["cfg"],
                spec["family"],
                spec["config_type"],
            )
            
            for blob in blobs:
                blob.add_parent(item, commit=False)

        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a config")

        try:
            db.session.commit()

            if is_new:
                hooks.on_created_object(item)
                self.on_created(item)
            else:
                hooks.on_reuploaded_object(item)
                self.on_reuploaded(item)
        finally:
            item.release_after_upload()

        logger.info(f'{self.ObjectType.__name__} added', extra={
            'dhash': item.dhash,
            'is_new': is_new
        })
        schema = ConfigItemResponseSchema()
        return schema.dump(item)


class APiRemotesTextBlobPullResource(Resource):
    session = urllib3.PoolManager()
    ObjectType = TextBlob
    on_created = hooks.on_created_file
    on_reuploaded = hooks.on_reuploaded_file

    # @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Pulls text blob from remote to local instance
        description: |
            Pulls text blob from the remote instance to the local instance
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
              description: Blob identifier
              schema:
                type: string
        responses:
            200:
                description: Information about pulled text blob
                content:
                  application/json:
                    schema: BlobItemResponseSchema
        """
        remote_url = app_config.get_key(f"remote:{remote_name}", "url")
        api_key = app_config.get_key(f"remote:{remote_name}", "api_key")
        response = self.session.request("GET", f"{remote_url}/api/blob/{identifier}",
                                        preload_content=False,
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})

        data = response.read()
        spec = json.loads(data.decode('utf-8'))
        try:

            item, is_new = TextBlob.get_or_create(
                spec["content"],
                spec["blob_name"],
                spec["blob_type"],
            )
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a config")

        try:
            db.session.commit()

            if is_new:
                hooks.on_created_object(item)
                self.on_created(item)
            else:
                hooks.on_reuploaded_object(item)
                self.on_reuploaded(item)
        finally:
            item.release_after_upload()

        logger.info(f'{self.ObjectType.__name__} added', extra={
            'dhash': item.dhash,
            'is_new': is_new
        })
        schema = BlobItemResponseSchema()
        return schema.dump(item)
