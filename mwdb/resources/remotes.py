from flask_restful import Resource
from flask import g
import requests
from mwdb.core.plugins import hooks
from werkzeug.exceptions import BadRequest, Conflict, NotFound, Forbidden
from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.schema.remotes import APIRemotesListResponseSchema
from mwdb.model import db, File, Config, TextBlob, Group
from mwdb.model.object import ObjectTypeConflictError
from mwdb.schema.file import FileItemResponseSchema
from mwdb.schema.config import ConfigItemResponseSchema
from mwdb.schema.blob import BlobItemResponseSchema
from tempfile import SpooledTemporaryFile
from . import logger, requires_authorization


class APIRemoteListResource(Resource):
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
            - api_remote
        responses:
            200:
                description: List of user configured remotes
                content:
                  application/json:
                    schema: GroupListResponseSchema
        """
        remotes = app_config.mwdb.remotes
        schema = APIRemotesListResponseSchema()
        return schema.dump({"remotes": remotes})


class APiRemotePullResource(Resource):
    session = requests.Session()
    ObjectType = None
    ItemResponseSchema = None

    on_created = None
    on_reuploaded = None

    def get_remote_api_data(self, remote_name):
        if remote_name not in app_config.mwdb.remotes:
            raise NotFound("Can't find saved remote mwdb instance with this name.")

        remote_url = app_config.get_key(f"remote:{remote_name}", "url")
        api_key = app_config.get_key(f"remote:{remote_name}", "api_key")
        return remote_url, api_key

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


class APiRemoteFilePullResource(APiRemotePullResource):
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
            404:
                description: When the search name of the remote instance is not figured in the application config
            409:
                description: Object exists yet but has different type
        """
        remote_url, api_key = self.get_remote_api_data(remote_name)
        response = self.session.request("GET", f"{remote_url}/api/file/{identifier}",
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})
        file_name = response.json()['file_name']

        response = self.session.request("POST", f"{remote_url}/api/request/sample/{identifier}",
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})
        download_url = response.json()['url']

        response = self.session.request("GET", f"{remote_url}/api/{download_url}",
                                        headers={'Authorization': 'Bearer {}'.format(api_key)},
                                        stream=True)

        with SpooledTemporaryFile() as file_stream:
            # for chunk in response.iter_content(chunk_size=64):
            #     file_stream.write(chunk)
            file_stream.write(response.raw.read())
            file_stream.seek(0)
            try:
                item, is_new = File.get_or_create(
                    file_name=file_name,
                    file_stream=file_stream,
                    share_with=[Group.get_by_name(g.auth_user.login)]
                )
            except ObjectTypeConflictError:
                raise Conflict("Object already exists and is not a file")

        return self.create_pulled_object(item, is_new)


class APiRemoteConfigPullResource(APiRemotePullResource):
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
            403:
                description: No permissions to perform additional operations (e.g. adding parent, metakeys)
            404:
                description: When the search name of the remote instance is not figured in the application config
            409:
                description: Object exists yet but has different type
        """
        remote_url, api_key = self.get_remote_api_data(remote_name)
        response = self.session.request("GET", f"{remote_url}/api/config/{identifier}",
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})
        spec = response.json()
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
                cfg=spec["cfg"],
                family=spec["family"],
                config_type=spec["config_type"],
                share_with=[Group.get_by_name(g.auth_user.login)]
            )
            
            for blob in blobs:
                blob.add_parent(item, commit=False)

        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a config")

        return self.create_pulled_object(item, is_new)


class APiRemoteTextBlobPullResource(APiRemotePullResource):
    ObjectType = TextBlob
    ItemResponseSchema = BlobItemResponseSchema

    on_created = hooks.on_created_text_blob
    on_reuploaded = hooks.on_reuploaded_text_blob

    # @requires_authorization
    def post(self, remote_name, identifier):
        """
        ---
        summary: Pulls text blob from remote to local instance
        description: |
            Pulls text blob from the remote instance to the local instance
        security:
            - bearerAuth: []
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
            404:
                description: When the search name of the remote instance is not figured in the application config
            409:
                description: Object exists yet but has different type
        """
        remote_url, api_key = self.get_remote_api_data(remote_name)
        response = self.session.request("GET", f"{remote_url}/api/blob/{identifier}",
                                        headers={'Authorization': 'Bearer {}'.format(api_key)})
        spec = response.json()
        try:
            item, is_new = TextBlob.get_or_create(
                content=spec["content"],
                blob_name=spec["blob_name"],
                blob_type=spec["blob_type"],
                share_with=[Group.get_by_name(g.auth_user.login)]
            )
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a config")

        return self.create_pulled_object(item, is_new)
