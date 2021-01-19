from flask_restful import Resource
from flask import g, redirect, url_for
import requests
from mwdb.core.plugins import hooks
from werkzeug.exceptions import BadRequest, Conflict, NotFound, Forbidden
from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.schema.remotes import RemotesListResponseSchema
from mwdb.model import db, File, Config, TextBlob
from mwdb.model.object import ObjectTypeConflictError
from mwdb.schema.file import FileItemResponseSchema
from mwdb.schema.config import ConfigItemResponseSchema
from mwdb.schema.blob import BlobItemResponseSchema
from tempfile import SpooledTemporaryFile
from . import access_object, logger, requires_authorization


class RemoteListResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: Get list of configured remote names
        description: |
            Return a list of available remote names
        security:
            - bearerAuth: []
        tags:
            - remotes
        responses:
            200:
                description: List of user configured remotes
                content:
                  application/json:
                    schema: RemotesListResponseSchema
        """
        remotes = app_config.mwdb.remotes
        schema = RemotesListResponseSchema()
        return schema.dump({"remotes": remotes})


class RemoteAPI:
    def __init__(self, remote_name):
        if remote_name not in app_config.mwdb.remotes:
            raise NotFound(f"Unknown remote instance name ('{remote_name}')")

        self.remote_url = app_config.get_key(f"remote:{remote_name}", "url")
        self.api_key = app_config.get_key(f"remote:{remote_name}", "api_key")
        self.session = requests.Session()

    @staticmethod
    def map_remote_api_error(response):
        if response.status_code == 200:
            return None
        elif response.status_code == 404:
            raise NotFound("Remote object not found")
        elif response.status_code == 403:
            raise Forbidden("You are not permitted to perform this action on remote instance")
        elif response.status_code == 409:
            raise Conflict("Remote object already exists in remote instance and has different type")
        else:
            response.raise_for_status()

    def request(self, method, path, *args, raw=False, **kwargs):
        response = self.session.request(method, f"{self.remote_url}/api/{path}", *args,
                                        headers={'Authorization': f'Bearer {self.api_key}'}, **kwargs)
        self.map_remote_api_error(response)
        return response if raw else response.json()


class RemoteAPIResource(Resource):
    def do_request(self, method, remote_name, remote_path):
        remote = RemoteAPI(remote_name)
        response = remote.request(method, remote_path)
        return response

    def get(self, *args, **kwargs):
        return self.do_request("get", *args, **kwargs)

    def post(self, *args, **kwargs):
        return self.do_request("post", *args, **kwargs)

    def put(self, *args, **kwargs):
        return self.do_request("put", *args, **kwargs)

    def delete(self, *args, **kwargs):
        return self.do_request("delete", *args, **kwargs)


class RemotePullResource(Resource):
    ObjectType = None
    ItemResponseSchema = None

    on_created = None
    on_reuploaded = None

    def create_pulled_object(self, item, is_new):
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
        schema = self.ItemResponseSchema()
        return schema.dump(item)


class RemoteFilePullResource(RemotePullResource):
    ObjectType = File
    ItemResponseSchema = FileItemResponseSchema

    on_created = hooks.on_created_file
    on_reuploaded = hooks.on_reuploaded_file

    @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Pulls file from remote to local instance
        description: |
            Pulls file from the remote instance to the local instance
        security:
            - bearerAuth: []
        tags:
            - remotes
        parameters:
            - in: path
              name: remote_name
              description: Name of remote instance
              schema:
                type: string
            - in: path
              name: identifier
              description: Object identifier (SHA256/SHA512/SHA1/MD5)
              schema:
                type: string
        responses:
            200:
                description: Information about pulled file
                content:
                  application/json:
                    schema: FileItemResponseSchema
            404:
                description: When the name of the remote instance is not figured in the application config
            409:
                description: Object exists yet but has different type
        """
        remote = RemoteAPI(remote_name)
        response = remote.request("GET", f"file/{identifier}")
        file_name = response['file_name']

        response = remote.request("POST", f"request/sample/{identifier}")
        download_url = response['url']

        response = remote.request("GET", download_url, raw=True, stream=True)
        with SpooledTemporaryFile() as file_stream:
            for chunk in response.iter_content(chunk_size=2**16):
                file_stream.write(chunk)
            file_stream.seek(0)
            try:
                item, is_new = File.get_or_create(
                    file_name=file_name,
                    file_stream=file_stream,
                    share_with=[group for group in g.auth_user.groups if group.name != "public"]
                )
            except ObjectTypeConflictError:
                raise Conflict("Object already exists locally and is not a file")

        return self.create_pulled_object(item, is_new)


class RemoteConfigPullResource(RemotePullResource):
    ObjectType = Config
    ItemResponseSchema = ConfigItemResponseSchema

    on_created = hooks.on_created_config
    on_reuploaded = hooks.on_reuploaded_config

    @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Pulls config from remote to local instance
        description: |
            Pulls config from the remote instance to the local instance
        security:
            - bearerAuth: []
        tags:
            - remotes
        parameters:
            - in: path
              name: remote_name
              description: Name of remote instance
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
            403:
                description: No permissions to perform additional operations (e.g. adding parent, metakeys)
            404:
                description: When the name of the remote instance is not figured in the application config
            409:
                description: Object exists yet but has different type
        """
        remote = RemoteAPI(remote_name)
        spec = remote.request("GET", f"config/{identifier}")
        try:
            config = dict(spec["cfg"])
            blobs = []
            for first, second in config.items():
                if isinstance(second, dict) and list(second.keys()) == ["in-blob"]:
                    if not g.auth_user.has_rights(Capabilities.adding_blobs):
                        raise Forbidden("You are not permitted to add blob objects")
                    in_blob = second["in-blob"]
                    if not isinstance(in_blob, str):
                        raise BadRequest("'in-blob' is not a correct blob reference")
                    blob_obj = TextBlob.access(in_blob)
                    if not blob_obj:
                        raise NotFound(f"Blob {in_blob} is referenced by config but doesn't exist locally")
                    blobs.append(blob_obj)
                    config[first]["in-blob"] = blob_obj.dhash

                elif isinstance(second, dict) and ("in-blob" in list(second.keys())):
                    raise BadRequest("'in-blob' should be the only key")

            item, is_new = Config.get_or_create(
                cfg=spec["cfg"],
                family=spec["family"],
                config_type=spec["config_type"],
                share_with=[group for group in g.auth_user.groups if group.name != "public"]
            )
            
            for blob in blobs:
                blob.add_parent(item, commit=False)

        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a config")

        return self.create_pulled_object(item, is_new)


class RemoteTextBlobPullResource(RemotePullResource):
    ObjectType = TextBlob
    ItemResponseSchema = BlobItemResponseSchema

    on_created = hooks.on_created_text_blob
    on_reuploaded = hooks.on_reuploaded_text_blob

    @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Pulls text blob from remote to local instance
        description: |
            Pulls text blob from the remote instance to the local instance
        security:
            - bearerAuth: []
        tags:
            - remotes
        parameters:
            - in: path
              name: remote_name
              description: Name of remote instance
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
            404:
                description: When the name of the remote instance is not figured in the application config
            409:
                description: Object exists yet but has different type
        """
        remote = RemoteAPI(remote_name)
        spec = remote.request("GET", f"blob/{identifier}")
        try:
            item, is_new = TextBlob.get_or_create(
                content=spec["content"],
                blob_name=spec["blob_name"],
                blob_type=spec["blob_type"],
                share_with=[group for group in g.auth_user.groups if group.name != "public"]
            )
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a config")

        return self.create_pulled_object(item, is_new)


class RemoteFilePushResource(RemotePullResource):
    @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Push file from local to remote instance
        description: |
            Push file from the local instance to the remote instance
        security:
            - bearerAuth: []
        tags:
            - remotes
        parameters:
            - in: path
              name: remote_name
              description: Name of remote instance
              schema:
                type: string
            - in: path
              name: identifier
              description: Object identifier (SHA256/SHA512/SHA1/MD5)
              schema:
                type: string
        responses:
            200:
                description: Information about pushed fie
            404:
                description: When the name of the remote instance is not figured in the application config
                             or object doesn't exist
        """
        db_object = access_object('file', identifier)
        if db_object is None:
            raise NotFound("Object not found")

        remote = RemoteAPI(remote_name)
        response = remote.request("POST", "file",
                                  files={'file': (db_object.file_name, db_object.open())})
        logger.info(f'{db_object.type} pushed remote', extra={
            'dhash': db_object.dhash,
            'remote_name': remote_name
        })
        return response


class RemoteConfigPushResource(RemotePullResource):
    @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Push config from local to remote instance
        description: |
            Push config from the local instance to the remote instance
        security:
            - bearerAuth: []
        tags:
            - remotes
        parameters:
            - in: path
              name: remote_name
              description: Name of remote instance
              schema:
                type: string
            - in: path
              name: identifier
              description: Object identifier (SHA256/SHA512/SHA1/MD5)
              schema:
                type: string
        responses:
            200:
                description: Information about pushed config
            404:
                description: When the name of the remote instance is not figured in the application config
                             or object doesn't exist
        """
        db_object = access_object('config', identifier)
        if db_object is None:
            raise NotFound("Object not found")

        remote = RemoteAPI(remote_name)
        params = {
            "family": db_object.family,
            "cfg": db_object.cfg,
            "config_type": db_object.config_type
        }
        response = remote.request("POST", "config", json=params)
        logger.info(f'{db_object.type} pushed remote', extra={
            'dhash': db_object.dhash,
            'remote_name': remote_name
        })
        return response


class RemoteTextBlobPushResource(RemotePullResource):
    @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Push text blob from local to remote instance
        description: |
            Push text blob from the local instance to the remote instance
        security:
            - bearerAuth: []
        tags:
            - remotes
        parameters:
            - in: path
              name: remote_name
              description: Name of remote instance
              schema:
                type: string
            - in: path
              name: identifier
              description: Object identifier (SHA256/SHA512/SHA1/MD5)
              schema:
                type: string
        responses:
            200:
                description: Information about pushed text blob
            404:
                description: When the name of the remote instance is not figured in the application config
                             or object doesn't exist
        """
        db_object = access_object('blob', identifier)
        if db_object is None:
            raise NotFound("Object not found")

        remote = RemoteAPI(remote_name)
        params = {
            "blob_name": db_object.blob_name,
            "blob_type": db_object.blob_type,
            "content": db_object.content
        }
        response = remote.request("POST", "blob", json=params)
        logger.info(f'{db_object.type} pushed remote', extra={
            'dhash': db_object.dhash,
            'remote_name': remote_name
        })
        return response
