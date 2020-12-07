import hashlib
import io
import os
import tempfile

from sqlalchemy import or_
from itsdangerous import TimedJSONWebSignatureSerializer, SignatureExpired, BadSignature
from werkzeug.utils import secure_filename

from mwdb.core.config import app_config, StorageProviderType
from mwdb.core.util import calc_hash, calc_crc32, calc_magic, calc_ssdeep, get_minio_client, get_fd_path

from . import db
from .object import Object


class EmptyFileError(ValueError):
    pass


class File(Object):
    __tablename__ = 'file'

    id = db.Column(db.Integer, db.ForeignKey('object.id'), primary_key=True)
    file_name = db.Column(db.String, nullable=False, index=True)
    file_size = db.Column(db.Integer, nullable=False, index=True)
    file_type = db.Column(db.Text, nullable=False, index=True)
    md5 = db.Column(db.String(32), nullable=False, index=True)
    crc32 = db.Column(db.String(8), nullable=False, index=True)
    sha1 = db.Column(db.String(40), nullable=False, index=True)
    sha256 = db.Column(db.String(64), nullable=False, index=True, unique=True)
    sha512 = db.Column(db.String(128), nullable=False, index=True)
    # ssdeep is nullable due to lack of support in earlier versions
    ssdeep = db.Column(db.String(255), nullable=True, index=True)

    __mapper_args__ = {
        'polymorphic_identity': __tablename__,
    }

    @classmethod
    def get(cls, identifier):
        identifier = identifier.lower()
        file = File.query.filter(File.dhash == identifier)
        if file.scalar():
            return file
        return File.query.filter(or_(
            File.sha1 == identifier,
            File.sha256 == identifier,
            File.sha512 == identifier,
            File.md5 == identifier))

    @property
    def upload_stream(self):
        return getattr(self, "_upload_stream", None)

    @upload_stream.setter
    def upload_stream(self, stream):
        setattr(self, "_upload_stream", stream)

    @classmethod
    def get_or_create(cls, file, parent=None, metakeys=None, share_with=None):
        file.stream.seek(0, os.SEEK_END)
        file_size = file.tell()
        if file_size == 0:
            raise EmptyFileError

        sha256 = calc_hash(file.stream, hashlib.sha256(), lambda h: h.hexdigest())
        file_obj = File(
            dhash=sha256,
            file_name=secure_filename(file.filename),
            file_size=file_size,
            file_type=calc_magic(file.stream),
            crc32=calc_crc32(file.stream),
            md5=calc_hash(file.stream, hashlib.md5(), lambda h: h.hexdigest()),
            sha1=calc_hash(file.stream, hashlib.sha1(), lambda h: h.hexdigest()),
            sha256=sha256,
            sha512=calc_hash(file.stream, hashlib.sha512(), lambda h: h.hexdigest()),
            ssdeep=calc_ssdeep(file.stream)
        )

        file_obj, is_new = cls._get_or_create(
            file_obj, parent=parent, metakeys=metakeys, share_with=share_with
        )

        if is_new:
            file.stream.seek(0, os.SEEK_SET)
            if app_config.mwdb.storage_provider == StorageProviderType.S3:
                get_minio_client(
                    app_config.mwdb.s3_storage_endpoint,
                    app_config.mwdb.s3_storage_access_key,
                    app_config.mwdb.s3_storage_secret_key,
                    app_config.mwdb.s3_storage_region_name,
                    app_config.mwdb.s3_storage_secure,
                ).put_object(
                    app_config.mwdb.s3_storage_bucket_name,
                    file_obj._calculate_path(),
                    file.stream,
                    file_size
                )
            else:
                file.save(file_obj._calculate_path())

        file_obj.upload_stream = file.stream
        return file_obj, is_new

    def _calculate_path(self):
        if app_config.mwdb.storage_provider == StorageProviderType.DISK:
            upload_path = app_config.mwdb.uploads_folder
        else:
            upload_path = ""

        sample_sha256 = self.sha256.lower()
        
        if app_config.mwdb.hash_pathing:
            # example: uploads/9/f/8/6/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
            upload_path = os.path.join(upload_path, *list(sample_sha256)[0:4])

        if app_config.mwdb.storage_provider == StorageProviderType.DISK:
            upload_path = os.path.abspath(upload_path)
            os.makedirs(upload_path, mode=0o755, exist_ok=True)
        return os.path.join(upload_path, sample_sha256)

    def get_path(self):
        """
        Legacy method used to retrieve the path to the file contents.

        Creates NamedTemporaryFile if mwdb-core uses different type of
        storage than DISK and file size is too small to be written to
        disk by Werkzeug.

        Deprecated, use File.open() to get the stream with contents.
        """
        if app_config.mwdb.storage_provider == StorageProviderType.DISK:
            # Just return path of file stored in local file-system
            return self._calculate_path()

        if not self.upload_stream:
            raise ValueError("Can't retrieve local path for this file")

        if type(self.upload_stream.name) is str:
            return self.upload_stream.name

        try:
            return get_fd_path(self.upload_stream)
        except OSError:
            # If not a file (BytesIO), copy contents to the named temporary file
            tmpfile = tempfile.NamedTemporaryFile()
            self.upload_stream.seek(0, os.SEEK_SET)
            tmpfile.write(self.upload_stream.read())
            self.upload_stream.close()
            self.upload_stream = tmpfile
            return self.upload_stream.name

    def open(self):
        """
        Opens the file stream with contents.

        File stream must be closed using File.close.
        """
        if self.upload_stream is not None:
            # If file contents are uploaded in this request,
            # try to reuse the existing file instead of downloading it from Minio.
            if isinstance(self.upload_stream, io.BytesIO):
                return io.BytesIO(self.upload_stream.getbuffer())
            else:
                dupfd = os.dup(self.upload_stream.fileno())
                return os.fdopen(dupfd, "rb")
        if app_config.mwdb.storage_provider == StorageProviderType.S3:
            return get_minio_client(
                app_config.mwdb.s3_storage_endpoint,
                app_config.mwdb.s3_storage_access_key,
                app_config.mwdb.s3_storage_secret_key,
                app_config.mwdb.s3_storage_region_name,
                app_config.mwdb.s3_storage_secure,
            ).get_object(app_config.mwdb.s3_storage_bucket_name, self._calculate_path())
        elif app_config.mwdb.storage_provider == StorageProviderType.DISK:
            return open(self._calculate_path(), 'rb')

    def read(self):
        """
        Reads all bytes from the file
        """
        fh = self.open()
        try:
            return fh.read()
        finally:
            File.close(fh)

    def iterate(self, chunk_size=1024*256):
        """
        Iterates over bytes in the file contents
        """
        fh = self.open()
        try:
            if hasattr(fh, "stream"):
                yield from fh.stream(chunk_size)
            else:
                while True:
                    chunk = fh.read(chunk_size)
                    if chunk:
                        yield chunk
                    else:
                        return
        finally:
            File.close(fh)

    @staticmethod
    def close(fh):
        """
        Closes file stream opened by File.open
        """
        fh.close()
        if hasattr(fh, "release_conn"):
            fh.release_conn()

    def release_after_upload(self):
        """
        Release additional resources used by uploaded file.
        e.g. NamedTemporaryFile opened by get_path()
        """
        if self.upload_stream:
            self.upload_stream.close()
            self.upload_stream = None

    def generate_download_token(self):
        serializer = TimedJSONWebSignatureSerializer(app_config.mwdb.secret_key, expires_in=60)
        return serializer.dumps({'identifier': self.sha256})

    @staticmethod
    def get_by_download_token(download_token):
        serializer = TimedJSONWebSignatureSerializer(app_config.mwdb.secret_key)
        try:
            download_req = serializer.loads(download_token)
            return File.get(download_req["identifier"]).first()
        except SignatureExpired:
            return None
        except BadSignature:
            return None
