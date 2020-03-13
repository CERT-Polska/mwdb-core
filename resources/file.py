import hashlib
import os

from datetime import datetime

import magic
import ssdeep

from flask import request, g
from werkzeug.exceptions import BadRequest
from werkzeug.utils import secure_filename

from plugin_engine import hooks
from core.humanhash import Humanhash
from model import File
from core.schema import FileShowSchema, MultiFileShowSchema
from core.util import calc_hash, crc32_sum, is_maintenance_set

from . import requires_authorization
from .object import ObjectResource, ObjectListResource


class FileListResource(ObjectListResource):
    ObjectType = File
    Schema = MultiFileShowSchema
    SchemaKey = "files"

    @requires_authorization
    def get(self):
        """
        ---
        description: Retrieves list of files
        security:
            - bearerAuth: []
        tags:
            - file
        parameters:
            - in: query
              name: older_than
              schema:
                type: string
              description: fetch objects which are older than the object specified by SHA256 identifier
              required: false
            - in: query
              name: query
              schema:
                type: string
              description: Filter results using Lucene query
        responses:
            200:
                description: List of files
                content:
                  application/json:
                    schema: MultiFileShowSchema
            400:
                description: Syntax error in Lucene query
        """
        return super(FileListResource, self).get()


class FileResource(ObjectResource):
    ObjectType = File
    ObjectTypeStr = File.__tablename__
    Schema = FileShowSchema
    on_created = hooks.on_created_file
    on_reuploaded = hooks.on_reuploaded_file

    @requires_authorization
    def get(self, identifier):
        """
        ---
        description: Fetch file information by hash
        security:
            - bearerAuth: []
        tags:
            - file
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: SHA256 or MD5 file unique identifier
        responses:
            200:
                description: When file was found
                content:
                  application/json:
                    schema: FileShowSchema
            404:
                description: When object was not found
        """
        return super(FileResource, self).get(identifier)

    def create_object(self, obj):
        file = request.files['file']
        file.stream.seek(0, os.SEEK_END)
        fsize = file.tell()
        if fsize == 0:
            raise BadRequest("Uploaded file is empty")

        sha256 = calc_hash(file.stream, hashlib.sha256(), lambda h: h.hexdigest())

        file.stream.seek(0, os.SEEK_SET)
        fmagic = magic.from_buffer(file.stream.read())

        # Create file first so we can add it without worrying about race conditions thanks to get_or_create
        db_file = File()
        db_file.file_name = secure_filename(request.files['file'].filename)
        db_file.file_size = fsize
        db_file.file_type = fmagic
        db_file.parents = []
        db_file.crc32 = crc32_sum(file.stream)
        db_file.md5 = calc_hash(file.stream, hashlib.md5(), lambda h: h.hexdigest())
        db_file.sha1 = calc_hash(file.stream, hashlib.sha1(), lambda h: h.hexdigest())
        db_file.sha256 = sha256
        db_file.dhash = sha256
        db_file.sha512 = calc_hash(file.stream, hashlib.sha512(), lambda h: h.hexdigest())
        db_file.humanhash = Humanhash._humanhash(sha256)
        db_file.ssdeep = calc_hash(file.stream, ssdeep.Hash(), lambda h: h.digest())
        db_file.upload_time = datetime.now()

        if is_maintenance_set() and g.auth_user.login == "admin":
            db_file.upload_time = obj.data.get("upload_time", datetime.now())

        db_file, is_file_new = File.get_or_create(db_file, file)

        return db_file, is_file_new

    @requires_authorization
    def post(self, identifier):
        """
        ---
        description: Upload new file
        security:
            - bearerAuth: []
        tags:
            - file
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: SHA256 or MD5 parent file unique identifier
        requestBody:
            required: true
            content:
              multipart/form-data:
                schema:
                  type: object
                  properties:
                    file:
                      type: string
                      format: binary
                      description: Sample to be uploaded
                    metakeys:
                      type: string
                      description: Optional JSON-encoded `MetakeyShowSchema` (only for permitted users)
                    upload_as:
                      type: string
                      default: '*'
                      description: Identity used for uploading sample
                  required:
                    - file
        responses:
            200:
                description: File uploaded succesfully
                content:
                  application/json:
                    schema: FileShowSchema
            403:
                description: No permissions to perform additional operations (e.g. adding metakeys)
            404:
                description: Specified group doesn't exist
            409:
                description: Object exists yet but has different type
        """
        return super(FileResource, self).post(identifier)
