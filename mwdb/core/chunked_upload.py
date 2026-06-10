import os
from typing import IO
from uuid import UUID
from zlib import crc32

import msgpack
import uuid

from flask import g
from marshmallow import Schema, fields
from rehashes import PyMd5, PySha1, PySha256, PySha512, PySsdeep

from mwdb.core.config import app_config, StorageProviderType
from redis import Redis

from mwdb.core.util import get_s3_client, calc_magic, relative_path_for_hash
from mwdb.schema.file import FileChunkedUploadRequestSchema

if app_config.mwdb.enable_chunked_upload:
    redis_client = Redis.from_url(app_config.mwdb.redis_uri)
else:
    redis_client = None

import logging

logger = logging.getLogger(__name__)

CHUNKED_UPLOAD_EXPIRATION = 3600  # seconds


class ChunkedUploadNotFound(Exception):
    pass


class ChunkedUploadBadRequest(Exception):
    pass


class ChunkedUploadHashState(Schema):
    md5 = fields.Raw(required=True)
    sha1 = fields.Raw(required=True)
    sha256 = fields.Raw(required=True)
    sha512 = fields.Raw(required=True)
    ssdeep = fields.Raw(required=True)
    crc32 = fields.Int(required=True)


class ChunkedUploadS3State(Schema):
    upload_id = fields.Str(required=True)
    etags = fields.List(fields.Str(), required=True)


class ChunkedUploadState(Schema):
    uploader_id = fields.Int(required=True)
    file_spec = fields.Nested(FileChunkedUploadRequestSchema, required=True)
    file_type = fields.Str(allow_none=True)
    uploaded_size = fields.Int(required=True)
    uploaded_chunks = fields.Int(required=True)
    hash_state = fields.Nested(ChunkedUploadHashState, allow_none=True)
    s3_state = fields.Nested(ChunkedUploadS3State, required=True)


def load_chunked_upload_state(upload_id: uuid.UUID) -> dict | None:
    if redis_client is None:
        raise RuntimeError("Chunked upload not enabled")

    upload_state_data = redis_client.get(f"chunked_upload:{str(upload_id)}")
    if upload_state_data is None:
        logger.warning(f"Chunked upload {str(upload_id)} expired")
        return None

    try:
        upload_state_obj = msgpack.unpackb(upload_state_data)
        upload_state = ChunkedUploadState().load(upload_state_obj)
    except Exception:
        logger.exception(f"Failed to deserialize chunked upload state for {str(upload_id)}")
        return None

    return upload_state


def store_chunked_upload_state(
    upload_id: uuid.UUID, upload_state: dict, update: bool = False
) -> bool:
    if redis_client is None:
        raise RuntimeError("Chunked upload not enabled")

    upload_state_data = msgpack.packb(ChunkedUploadState().dump(upload_state))
    return redis_client.set(
        f"chunked_upload:{str(upload_id)}",
        upload_state_data,
        ex=CHUNKED_UPLOAD_EXPIRATION,
        xx=update,
    )


def forget_chunked_upload_state(upload_id: uuid.UUID):
    if redis_client is None:
        raise RuntimeError("Chunked upload not enabled")

    redis_client.delete(f"chunked_upload:{str(upload_id)}")


def connect_s3_client():
    if app_config.mwdb.storage_provider != StorageProviderType.S3:
        raise RuntimeError("Chunked upload requires S3 provider")
    return get_s3_client(
        app_config.mwdb.s3_storage_endpoint,
        app_config.mwdb.s3_storage_access_key,
        app_config.mwdb.s3_storage_secret_key,
        app_config.mwdb.s3_storage_region_name,
        app_config.mwdb.s3_storage_secure,
        app_config.mwdb.s3_storage_iam_auth,
    )

def initiate_chunked_upload(file_spec: dict) -> UUID:
    upload_id = uuid.uuid4()
    storage_path = relative_path_for_hash(file_spec["sha256"])

    upload_state = {
        "uploader_id": g.auth_user.id,
        "file_spec": file_spec,
        "file_type": None,
        "uploaded_size": 0,
        "uploaded_chunks": 0,
        "hash_state": None,
    }

    if file_spec["file_size"] > app_config.mwdb_chunked_upload.max_file_size:
        raise ChunkedUploadBadRequest("File size exceeds limit: "
                                      f"{file_spec['file_size']} > "
                                      f"{app_config.mwdb_chunked_upload.max_file_size}")

    s3_client = connect_s3_client()
    response = s3_client.create_multipart_upload(
        Bucket=app_config.mwdb.s3_storage_bucket_name,
        Key=storage_path,
    )
    s3_upload_id = response["UploadId"]
    s3_etags = []
    upload_state["s3_state"] = {
        "upload_id": s3_upload_id,
        "etags": s3_etags,
    }

    store_chunked_upload_state(upload_id, upload_state)
    return upload_id


class HashingStreamWrapper:
    def __init__(self, chunk_stream: IO[bytes], hash_state: dict | None = None):
        self.stream = chunk_stream
        self.was_read = False
        self._initial_hash_state = hash_state
        self.reset_hash_state()

    def reset_hash_state(self):
        if self._initial_hash_state is None:
            self.md5_state = PyMd5()
            self.sha1_state = PySha1()
            self.sha256_state = PySha256()
            self.sha512_state = PySha512()
            self.ssdeep_state = PySsdeep()
            self.crc32_state = 0
        else:
            self.md5_state = PyMd5.deserialize(self._initial_hash_state["md5"])
            self.sha1_state = PySha1.deserialize(self._initial_hash_state["sha1"])
            self.sha256_state = PySha256.deserialize(self._initial_hash_state["sha256"])
            self.sha512_state = PySha512.deserialize(self._initial_hash_state["sha512"])
            self.ssdeep_state = PySsdeep.deserialize(self._initial_hash_state["ssdeep"])
            self.crc32_state = self._initial_hash_state["crc32"]

    def tell(self):
        return self.stream.tell()

    def seek(self, offset: int, whence: int = 0):
        if self.was_read:
            self.was_read = False
            if offset == 0 and whence == 0:
                self.reset_hash_state()
        return self.stream.seek(offset, whence)

    def read(self, n: int = -1):
        if not self.was_read:
            if self.stream.tell() != 0:
                raise RuntimeError(
                    "Started reading from stream that was not on the beginning"
                )
            self.was_read = True
        data = self.stream.read(n)
        if data:
            self.md5_state.update(data)
            self.sha1_state.update(data)
            self.sha256_state.update(data)
            self.sha512_state.update(data)
            self.ssdeep_state.update(data)
            self.crc32_state = crc32(data, self.crc32_state)
        return data

    def serialize_hash_state(self):
        return {
            "md5": self.md5_state.serialize(),
            "sha1": self.sha1_state.serialize(),
            "sha256": self.sha256_state.serialize(),
            "sha512": self.sha512_state.serialize(),
            "ssdeep": self.ssdeep_state.serialize(),
            "crc32": self.crc32_state,
        }


def finalize_hashes(hash_state: dict):
    return {
        "md5": PyMd5.deserialize(hash_state["md5"]).finalize(),
        "sha1": PySha1.deserialize(hash_state["sha1"]).finalize(),
        "sha256": PySha256.deserialize(hash_state["sha256"]).finalize(),
        "sha512": PySha512.deserialize(hash_state["sha512"]).finalize(),
        "ssdeep": PySsdeep.deserialize(hash_state["ssdeep"]).finalize(),
        "crc32": "{:08x}".format(hash_state["crc32"]),
    }


def chunked_upload_part(
    upload_id: uuid.UUID, chunk_number: int, chunk_stream: IO[bytes], is_last: bool
):
    upload_state = load_chunked_upload_state(upload_id)
    if not upload_state:
        raise ChunkedUploadNotFound()

    if upload_state["uploader_id"] != g.auth_user.id:
        logger.warning(
            f"Got request for chunked upload {upload_id} from different user"
            f"(initiator id:  {upload_state['uploader_id']}, requestor id: {g.auth_user.id})"
        )
        raise ChunkedUploadNotFound()

    if (upload_state["uploaded_chunks"] + 1) != chunk_number:
        raise ChunkedUploadBadRequest(
            f"Out-of-order chunk number (expected {upload_state['uploaded_chunks'] + 1}, "
            f"got {chunk_number})"
        )

    upload_state["uploaded_chunks"] += 1

    chunk_length = chunk_stream.seek(0, os.SEEK_END)

    if not is_last:
        if (
            chunk_number == 1
            and chunk_length < app_config.mwdb_chunked_upload.min_first_chunk_size
        ):
            raise ChunkedUploadBadRequest(
                "Chunk is too small for the first and not last chunk"
            )
        elif (
            chunk_number > 1 and chunk_length < app_config.mwdb_chunked_upload.min_chunk_size
        ):
            raise ChunkedUploadBadRequest(
                "Chunk is too small for the chunk that is not last one"
            )

    if (
        chunk_length + upload_state["uploaded_size"]
        > upload_state["file_spec"]["file_size"]
    ):
        raise ChunkedUploadBadRequest("Uploaded file size exceeded declared file size")

    if chunk_length == 0:
        raise ChunkedUploadBadRequest("Empty chunks are not allowed")

    upload_state["uploaded_size"] += chunk_length

    chunk_stream.seek(0, os.SEEK_SET)

    if chunk_number == 1:
        # libmagic file type is evaluated only from the first chunk
        file_type = calc_magic(chunk_stream)
        chunk_stream.seek(0, os.SEEK_SET)
        upload_state["file_type"] = file_type

    hashing_stream = HashingStreamWrapper(chunk_stream, upload_state["hash_state"])

    s3_client = connect_s3_client()
    storage_path = relative_path_for_hash(upload_state["file_spec"]["sha256"])
    s3_upload_id = upload_state["s3_state"]["upload_id"]
    response = s3_client.upload_part(
        Bucket=app_config.mwdb.s3_storage_bucket_name,
        Key=storage_path,
        Body=hashing_stream,
        PartNumber=chunk_number,
        UploadId=s3_upload_id,
    )
    etag = response["ETag"]
    upload_state["s3_state"]["etags"].append(etag)
    upload_state["hash_state"] = hashing_stream.serialize_hash_state()
    if not store_chunked_upload_state(upload_id, upload_state, update=True):
        s3_client.abort_multipart_upload(
            Bucket=app_config.mwdb.s3_storage_bucket_name,
            Key=storage_path,
            UploadId=s3_upload_id,
        )
        raise RuntimeError(f"Failed to store chunked upload state {upload_id}")


def finalize_chunked_upload(upload_id: uuid.UUID):
    upload_state = load_chunked_upload_state(upload_id)
    if not upload_state:
        raise ChunkedUploadNotFound()

    if upload_state["uploaded_chunks"] == 0:
        raise ChunkedUploadBadRequest("Empty files are not allowed")

    s3_client = connect_s3_client()
    storage_path = relative_path_for_hash(upload_state["file_spec"]["sha256"])
    s3_upload_id = upload_state["s3_state"]["upload_id"]

    try:
        if upload_state["file_spec"]["file_size"] != upload_state["uploaded_size"]:
            raise ChunkedUploadBadRequest(
                f"Uploaded file size {upload_state['uploaded_size']} is not equal to the "
                f"declared value ({upload_state['file_spec']['file_size']})"
            )

        hashes = finalize_hashes(upload_state["hash_state"])
        if hashes["sha256"] != upload_state["file_spec"]["sha256"]:
            raise ChunkedUploadBadRequest(
                f"sha256 '{hashes['sha256']}' is not equal to the "
                f"declared value ({upload_state['file_spec']['sha256']})"
            )
    except Exception:
        s3_client.abort_multipart_upload(
            Bucket=app_config.mwdb.s3_storage_bucket_name,
            Key=storage_path,
            UploadId=s3_upload_id,
        )
        forget_chunked_upload_state(upload_id)
        raise

    s3_client.complete_multipart_upload(
        Bucket=app_config.mwdb.s3_storage_bucket_name,
        Key=storage_path,
        UploadId=s3_upload_id,
        MultipartUpload={
            "Parts": [
                {"ETag": etag, "PartNumber": index + 1}
                for index, etag in enumerate(upload_state["s3_state"]["etags"])
            ]
        },
    )
    final_file_spec = {
        **upload_state["file_spec"],
        "file_type": upload_state["file_type"],
        **hashes,
    }
    forget_chunked_upload_state(upload_id)
    return final_file_spec
