import json
from tempfile import SpooledTemporaryFile

import requests
from flask import Response, g, request
from flask_restful import Resource
from werkzeug.exceptions import BadRequest, Conflict, Forbidden, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.core.plugins import hooks
from mwdb.model import Config, File, TextBlob, db
from mwdb.model.object import ObjectTypeConflictError
from mwdb.schema.blob import BlobItemResponseSchema
from mwdb.schema.config import ConfigItemResponseSchema
from mwdb.schema.file import FileItemResponseSchema
from mwdb.schema.remotes import RemoteOptionsRequestSchema, RemotesListResponseSchema
from mwdb.version import app_build_version

from . import get_shares_for_upload, loads_schema, logger, requires_authorization


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
        self.session.headers["User-Agent"] = (
            f"mwdb-core/{app_build_version} " + self.session.headers["User-Agent"]
        )

    @staticmethod
    def map_remote_api_error(response):
        if response.status_code == 200:
            return None
        elif response.status_code == 404:
            raise NotFound("Remote object not found")
        elif response.status_code == 403:
            raise Forbidden(
                "You are not permitted to perform this action on remote instance"
            )
        elif response.status_code == 409:
            raise Conflict(
                "Remote object already exists in remote instance and has different type"
            )
        else:
            response.raise_for_status()

    def request(self, method, path, *args, **kwargs):
        response = self.session.request(
            method,
            f"{self.remote_url}/api/{path}",
            *args,
            headers={"Authorization": f"Bearer {self.api_key}"},
            **kwargs,
        )
        self.map_remote_api_error(response)
        return response


class RemoteAPIResource(Resource):
    def do_request(self, method, remote_name, remote_path):
        remote = RemoteAPI(remote_name)
        response = remote.request(
            method, remote_path, params=request.args, data=request.data, stream=True
        )
        return Response(
            response.iter_content(chunk_size=2 ** 16),
            mimetype=response.headers["content-type"],
        )

    def get(self, remote_name, remote_path):
        return self.do_request("get", remote_name, remote_path)

    def post(self, remote_name, remote_path):
        return self.do_request("post", remote_name, remote_path)

    def put(self, remote_name, remote_path):
        return self.do_request("put", remote_name, remote_path)

    def delete(self, remote_name, remote_path):
        return self.do_request("delete", remote_name, remote_path)


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

        logger.info(
            f"{self.ObjectType.__name__} added",
            extra={"dhash": item.dhash, "is_new": is_new},
        )
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
        requestBody:
            required: false
            description: Additional options for object pull
            content:
              application/json:
                schema: RemoteOptionsRequestSchema
        responses:
            200:
                description: Information about pulled file
                content:
                  application/json:
                    schema: FileItemResponseSchema
            404:
                description: |
                    When the name of the remote instance is not figured
                    in the application config
            409:
                description: Object exists yet but has different type
        """
        remote = RemoteAPI(remote_name)
        response = remote.request("GET", f"file/{identifier}")
        file_name = response.json()["file_name"]
        response = remote.request("GET", f"file/{identifier}/download", stream=True)
        options = loads_schema(
            request.get_data(as_text=True), RemoteOptionsRequestSchema()
        )
        share_with = get_shares_for_upload(options["upload_as"])
        with SpooledTemporaryFile() as file_stream:
            for chunk in response.iter_content(chunk_size=2 ** 16):
                file_stream.write(chunk)
            file_stream.seek(0)
            try:
                item, is_new = File.get_or_create(
                    file_name=file_name,
                    file_stream=file_stream,
                    share_with=share_with,
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
        requestBody:
            required: false
            description: Additional options for object pull
            content:
              application/json:
                schema: RemoteOptionsRequestSchema
        responses:
            200:
                description: Information about pulled config
                content:
                  application/json:
                    schema: ConfigItemResponseSchema
            403:
                description: |
                    No permissions to perform additional operations
                    (e.g. adding parent, metakeys)
            404:
                description: |
                    When the name of the remote instance is not figured
                    in the application config
            409:
                description: Object exists yet but has different type
        """
        remote = RemoteAPI(remote_name)
        config_spec = remote.request("GET", f"config/{identifier}").json()
        options = loads_schema(
            request.get_data(as_text=True), RemoteOptionsRequestSchema()
        )
        share_with = get_shares_for_upload(options["upload_as"])
        try:
            config = dict(config_spec["cfg"])
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
                        # If blob object doesn't exist locally: pull it as well
                        blob_spec = remote.request("GET", f"blob/{in_blob}").json()
                        blob_obj, _ = TextBlob.get_or_create(
                            content=blob_spec["content"],
                            blob_name=blob_spec["blob_name"],
                            blob_type=blob_spec["blob_type"],
                            share_with=share_with,
                        )
                    blobs.append(blob_obj)
                    config[first]["in-blob"] = blob_obj.dhash

                elif isinstance(second, dict) and ("in-blob" in list(second.keys())):
                    raise BadRequest("'in-blob' should be the only key")

            item, is_new = Config.get_or_create(
                cfg=config_spec["cfg"],
                family=config_spec["family"],
                config_type=config_spec["config_type"],
                share_with=share_with,
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
        requestBody:
            required: false
            description: Additional options for object pull
            content:
              application/json:
                schema: RemoteOptionsRequestSchema
        responses:
            200:
                description: Information about pulled text blob
                content:
                  application/json:
                    schema: BlobItemResponseSchema
                description: |
                    When the name of the remote instance is not figured
                    in the application config
            409:
                description: Object exists yet but has different type
        """
        remote = RemoteAPI(remote_name)
        spec = remote.request("GET", f"blob/{identifier}").json()
        options = loads_schema(
            request.get_data(as_text=True), RemoteOptionsRequestSchema()
        )
        share_with = get_shares_for_upload(options["upload_as"])
        try:
            item, is_new = TextBlob.get_or_create(
                content=spec["content"],
                blob_name=spec["blob_name"],
                blob_type=spec["blob_type"],
                share_with=share_with,
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
        requestBody:
            required: false
            description: Additional options for object push
            content:
              application/json:
                schema: RemoteOptionsRequestSchema
        responses:
            200:
                description: Information about pushed fie
            404:
                description: |
                    When the name of the remote instance is not figured
                    in the application config or object doesn't exist
        """
        db_object = File.access(identifier)
        if db_object is None:
            raise NotFound("Object not found")

        remote = RemoteAPI(remote_name)
        options = loads_schema(
            request.get_data(as_text=True), RemoteOptionsRequestSchema()
        )
        response = remote.request(
            "POST",
            "file",
            files={
                "file": (db_object.file_name, db_object.open()),
                "options": (None, json.dumps(options)),
            },
        ).json()
        logger.info(
            f"{db_object.type} pushed remote",
            extra={"dhash": db_object.dhash, "remote_name": remote_name},
        )
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
        requestBody:
            required: false
            description: Additional options for object push
            content:
              application/json:
                schema: RemoteOptionsRequestSchema
        responses:
            200:
                description: Information about pushed config
            404:
                description: |
                    When the name of the remote instance is not figured
                    in the application config or object doesn't exist
        """
        db_object = Config.access(identifier)
        if db_object is None:
            raise NotFound("Object not found")

        config = db_object.cfg
        # Extract in-blob references into embedded content
        for first, second in config.items():
            if isinstance(second, dict) and list(second.keys()) == ["in-blob"]:
                in_blob = second["in-blob"]
                if not isinstance(in_blob, str):
                    raise BadRequest(
                        "'in-blob' key doesn't contain a correct blob reference"
                    )
                embedded_blob = TextBlob.access(in_blob)
                if not embedded_blob:
                    raise NotFound(f"Referenced blob '{in_blob}' doesn't exist")
                second["in-blob"] = {
                    "content": embedded_blob.content,
                    "blob_name": embedded_blob.blob_name,
                    "blob_type": embedded_blob.blob_type,
                }

        remote = RemoteAPI(remote_name)
        options = loads_schema(
            request.get_data(as_text=True), RemoteOptionsRequestSchema()
        )
        params = {
            "family": db_object.family,
            "cfg": config,
            "config_type": db_object.config_type,
            "upload_as": options["upload_as"],
        }
        response = remote.request("POST", "config", json=params).json()
        logger.info(
            f"{db_object.type} pushed remote",
            extra={"dhash": db_object.dhash, "remote_name": remote_name},
        )
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
        requestBody:
            required: false
            description: Additional options for object push
            content:
              application/json:
                schema: RemoteOptionsRequestSchema
        responses:
            200:
                description: Information about pushed text blob
            404:
                description: |
                    When the name of the remote instance is not figured
                    in the application config or object doesn't exist
        """
        db_object = TextBlob.access(identifier)
        if db_object is None:
            raise NotFound("Object not found")

        remote = RemoteAPI(remote_name)
        options = loads_schema(
            request.get_data(as_text=True), RemoteOptionsRequestSchema()
        )
        params = {
            "blob_name": db_object.blob_name,
            "blob_type": db_object.blob_type,
            "content": db_object.content,
            "upload_as": options["upload_as"],
        }
        response = remote.request("POST", "blob", json=params).json()
        logger.info(
            f"{db_object.type} pushed remote",
            extra={"dhash": db_object.dhash, "remote_name": remote_name},
        )
        return response
