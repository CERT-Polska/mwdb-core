import io
import os
import shutil
import tempfile

from mwdb.core.config import StorageProviderType, app_config
from mwdb.core.util import get_s3_client


def write_to_storage(file_stream, file_object):
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
            Key=file_object._calculate_path(),
            Body=file_stream,
        )
    elif app_config.mwdb.storage_provider == StorageProviderType.DISK:
        with open(file_object._calculate_path(), "wb") as f:
            shutil.copyfileobj(file_stream, f)
    else:
        raise RuntimeError(
            f"StorageProvider {app_config.mwdb.storage_provider} " f"is not supported"
        )


def get_from_storage(file_object):
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
                Key=file_object._calculate_path(),
                Fileobj=stream,
            )
            stream.seek(0, io.SEEK_SET)
            return stream
        except Exception:
            stream.close()
            raise
    elif app_config.mwdb.storage_provider == StorageProviderType.DISK:
        return open(file_object._calculate_path(), "rb")
    else:
        raise RuntimeError(
            f"StorageProvider {app_config.mwdb.storage_provider} is not supported"
        )


def delete_from_storage(file_object):
    if app_config.mwdb.storage_provider == StorageProviderType.S3:
        get_s3_client(
            app_config.mwdb.s3_storage_endpoint,
            app_config.mwdb.s3_storage_access_key,
            app_config.mwdb.s3_storage_secret_key,
            app_config.mwdb.s3_storage_region_name,
            app_config.mwdb.s3_storage_secure,
            app_config.mwdb.s3_storage_iam_auth,
        ).delete_object(
            Bucket=app_config.mwdb.s3_storage_bucket_name,
            Key=file_object._calculate_path(),
        )
    elif app_config.mwdb.storage_provider == StorageProviderType.DISK:
        os.remove(file_object._calculate_path())
    else:
        raise RuntimeError(
            f"StorageProvider {app_config.mwdb.storage_provider} " f"is not supported"
        )


def iterate_buffer(file_object, chunk_size=1024 * 256):
    """
    Iterates over bytes in the file contents
    """
    fh = file_object.open()
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
        fh.close()
