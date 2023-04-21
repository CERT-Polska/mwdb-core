import hashlib
import io
import os
import shutil
import tempfile

import pyzipper
from Cryptodome.Util.strxor import strxor_c
from sqlalchemy import or_
from sqlalchemy.dialects.postgresql.array import ARRAY
from sqlalchemy.ext.mutable import MutableList
from werkzeug.utils import secure_filename

from mwdb.core.auth import AuthScope, generate_token, verify_token
from mwdb.core.config import StorageProviderType, app_config
from mwdb.core.karton import send_file_to_karton
from mwdb.core.util import (
    calc_crc32,
    calc_hash,
    calc_magic,
    calc_ssdeep,
    get_fd_path,
    get_s3_client,
)

from . import db
from .object import Object


class EmptyFileError(ValueError):
    pass


class File(Object):
    file_name = db.Column(db.String, index=True)
    file_size = db.Column(db.Integer, index=True)
    file_type = db.Column(db.Text, index=True)
    md5 = db.Column(db.String(32), index=True)
    crc32 = db.Column(db.String(8), index=True)
    sha1 = db.Column(db.String(40), index=True)
    sha256 = db.Column(db.String(64), index=True, unique=True)
    sha512 = db.Column(db.String(128), index=True)
    ssdeep = db.Column(db.String(255), index=True)
    alt_names = db.Column(
        MutableList.as_mutable(ARRAY(db.String)), nullable=False, server_default="{}"
    )

    __mapper_args__ = {
        "polymorphic_identity": "file",
    }

    @classmethod
    def get(cls, identifier):
        identifier = identifier.lower()
        file = File.query.filter(File.dhash == identifier)
        if file.scalar():
            return file
        return File.query.filter(
            or_(
                File.sha1 == identifier,
                File.sha256 == identifier,
                File.sha512 == identifier,
                File.md5 == identifier,
            )
        )

    @property
    def upload_stream(self):
        """
        Stream with file contents if a file is uploaded in current request.

        In that case, we don't need to download it from object storage.
        """
        return getattr(self, "_upload_stream", None)

    @upload_stream.setter
    def upload_stream(self, stream):
        setattr(self, "_upload_stream", stream)

    @classmethod
    def get_or_create(
        cls,
        file_name,
        file_stream,
        share_3rd_party,
        parent=None,
        attributes=None,
        share_with=None,
        analysis_id=None,
        tags=None,
    ):
        file_stream.seek(0, os.SEEK_END)
        file_size = file_stream.tell()
        if file_size == 0:
            raise EmptyFileError

        sha256 = calc_hash(file_stream, hashlib.sha256(), lambda h: h.hexdigest())
        file_obj = File(
            dhash=sha256,
            file_name=secure_filename(file_name),
            file_size=file_size,
            file_type=calc_magic(file_stream),
            crc32=calc_crc32(file_stream),
            md5=calc_hash(file_stream, hashlib.md5(), lambda h: h.hexdigest()),
            sha1=calc_hash(file_stream, hashlib.sha1(), lambda h: h.hexdigest()),
            sha256=sha256,
            sha512=calc_hash(file_stream, hashlib.sha512(), lambda h: h.hexdigest()),
            ssdeep=calc_ssdeep(file_stream),
            share_3rd_party=share_3rd_party,
        )

        file_obj, is_new = cls._get_or_create(
            file_obj,
            share_3rd_party=share_3rd_party,
            parent=parent,
            attributes=attributes,
            share_with=share_with,
            analysis_id=analysis_id,
            tags=tags,
        )

        # Check if add new alternative file name
        if not is_new:
            original_filename = secure_filename(file_name)
            if (
                file_obj.file_name != original_filename
                and original_filename not in file_obj.alt_names
            ):
                file_obj.alt_names.append(original_filename)

        if is_new:
            file_stream.seek(0, os.SEEK_SET)
            if app_config.mwdb.storage_provider == StorageProviderType.S3:
                get_s3_client(
                    app_config.mwdb.s3_storage_endpoint,
                    app_config.mwdb.s3_storage_access_key,
                    app_config.mwdb.s3_storage_secret_key,
                    app_config.mwdb.s3_storage_region_name,
                    app_config.mwdb.s3_storage_secure,
                    app_config.mwdb.s3_storage_iam_auth,
                ).put_object(
                    Bucket=app_config.mwdb.s3_storage_bucket_name,
                    Key=file_obj._calculate_path(),
                    Body=file_stream,
                )
            elif app_config.mwdb.storage_provider == StorageProviderType.DISK:
                with open(file_obj._calculate_path(), "wb") as f:
                    shutil.copyfileobj(file_stream, f)
            else:
                raise RuntimeError(
                    f"StorageProvider {app_config.mwdb.storage_provider} "
                    f"is not supported"
                )

        file_obj.upload_stream = file_stream
        return file_obj, is_new

    def _calculate_path(self):
        if app_config.mwdb.storage_provider == StorageProviderType.DISK:
            upload_path = app_config.mwdb.uploads_folder
        elif app_config.mwdb.storage_provider == StorageProviderType.S3:
            upload_path = ""
        else:
            raise RuntimeError(
                f"StorageProvider {app_config.mwdb.storage_provider} is not supported"
            )

        sample_sha256 = self.sha256.lower()

        if app_config.mwdb.hash_pathing:
            # example: uploads/9/f/8/6/9f86d0818...
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

        if isinstance(self.upload_stream.name, str) or isinstance(
            self.upload_stream, bytes
        ):
            return self.upload_stream.name

        fd_path = get_fd_path(self.upload_stream)
        if fd_path:
            return fd_path

        # If not a file (BytesIO), copy contents to the named temporary file
        tmpfile = tempfile.NamedTemporaryFile()
        self.upload_stream.seek(0, os.SEEK_SET)
        shutil.copyfileobj(self.upload_stream, tmpfile)
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
            # try to reuse the existing file instead of downloading it from S3.
            if isinstance(self.upload_stream, io.BytesIO):
                return io.BytesIO(self.upload_stream.getbuffer())
            else:
                dupfd = os.dup(self.upload_stream.fileno())
                stream = os.fdopen(dupfd, "rb")
                stream.seek(0, os.SEEK_SET)
                return stream
        if app_config.mwdb.storage_provider == StorageProviderType.S3:
            # Stream coming from Boto3 get_object is not buffered and not seekable.
            # We need to download it to the temporary file first.
            stream = tempfile.TemporaryFile(mode="w+b")
            try:
                get_s3_client(
                    app_config.mwdb.s3_storage_endpoint,
                    app_config.mwdb.s3_storage_access_key,
                    app_config.mwdb.s3_storage_secret_key,
                    app_config.mwdb.s3_storage_region_name,
                    app_config.mwdb.s3_storage_secure,
                    app_config.mwdb.s3_storage_iam_auth,
                ).download_fileobj(
                    Bucket=app_config.mwdb.s3_storage_bucket_name,
                    Key=self._calculate_path(),
                    Fileobj=stream,
                )
                stream.seek(0, io.SEEK_SET)
                return stream
            except Exception:
                stream.close()
                raise
        elif app_config.mwdb.storage_provider == StorageProviderType.DISK:
            return open(self._calculate_path(), "rb")
        else:
            raise RuntimeError(
                f"StorageProvider {app_config.mwdb.storage_provider} is not supported"
            )

    def read(self):
        """
        Reads all bytes from the file
        """
        fh = self.open()
        try:
            return fh.read()
        finally:
            File.close(fh)

    def iterate(self, chunk_size=1024 * 256):
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

    def iterate_obfuscated(self, chunk_size=1024 * 256):
        r"""
        Iterates over bytes in the file contents with xor applied
        The idea behind xoring before send is to prevent browsers
        from caching original samples (malware). Unxoring is provided
        in mwdb\web\src\components\ShowSample.js in SamplePreview
        """

        def negate_bits(chunk):
            return strxor_c(chunk, 255)

        fh = self.open()
        try:
            if hasattr(fh, "stream"):
                yield from map(negate_bits, fh.stream(chunk_size))
            else:
                while True:
                    chunk = fh.read(chunk_size)
                    chunk = negate_bits(chunk)
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

    def zip_file(self):
        secret_password = b"infected"

        with tempfile.NamedTemporaryFile() as writer:
            with open(writer.name, "rb") as reader:
                with pyzipper.AESZipFile(
                    writer,
                    "w",
                    compression=pyzipper.ZIP_LZMA,
                    encryption=pyzipper.WZ_AES,
                ) as zf:
                    zf.setpassword(secret_password)
                    zf.writestr(self.file_name, self.read())
                    yield reader.read()
                writer.flush()
                yield reader.read()

    def release_after_upload(self):
        """
        Release additional resources used by uploaded file.
        e.g. NamedTemporaryFile opened by get_path()
        """
        if self.upload_stream:
            self.upload_stream.close()
            self.upload_stream = None

    def generate_download_token(self):
        return generate_token(
            {"identifier": self.sha256},
            scope=AuthScope.download_file,
            expiration=60,
        )

    @staticmethod
    def get_by_download_token(download_token):
        download_req = verify_token(download_token, scope=AuthScope.download_file)
        if not download_req:
            return None
        return File.get(download_req["identifier"]).first()

    def _send_to_karton(self):
        return send_file_to_karton(self)
