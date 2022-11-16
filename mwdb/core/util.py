import io
import os

try:
    from secrets import token_hex
except ImportError:
    from os import urandom

    def token_hex(nbytes=None):
        return urandom(nbytes).hex()


import hashlib
from zlib import crc32

import boto3
import botocore.client
import magic
import ssdeep
from botocore.credentials import (
    ContainerProvider,
    InstanceMetadataFetcher,
    InstanceMetadataProvider,
)
from flask_restful import abort
from flask_sqlalchemy import Pagination


def config_dhash(obj):
    if isinstance(obj, list):
        return config_dhash(str(sorted([config_dhash(o) for o in obj])))
    elif isinstance(obj, dict):
        return config_dhash([[o, config_dhash(obj[o])] for o in sorted(obj.keys())])
    else:
        return hashlib.sha256(bytes(str(obj), "utf-8")).hexdigest()


def traverse(obj, fn):
    if isinstance(obj, list):
        return [traverse(o, fn) for o in obj]
    elif isinstance(obj, tuple):
        return tuple(traverse(o, fn) for o in obj)
    elif isinstance(obj, dict):
        return {k: traverse(o, fn) for k, o in obj.items()}
    else:
        return fn(obj)


def config_encode(obj):
    return traverse(
        obj,
        lambda o: o.encode("unicode_escape").decode("utf-8")
        if isinstance(o, str)
        else o,
    )


def config_decode(obj):
    return traverse(
        obj,
        lambda o: bytes(o, "utf-8").decode("unicode_escape")
        if isinstance(o, str)
        else o,
    )


def calc_hash(stream, hash_obj, digest_cb):
    stream.seek(0, os.SEEK_SET)

    for chunk in iter(lambda: stream.read(128 * 1024), b""):
        hash_obj.update(chunk)

    return digest_cb(hash_obj)


def get_fd_path(stream):
    """
    Return Unix path for file-like stream. Hack for libraries
    that does not support a stream or file descriptor input.
    """
    try:
        return f"/proc/self/fd/{stream.fileno()}"
    except io.UnsupportedOperation:
        return None


def calc_magic(stream) -> str:
    # Missing python-magic features:
    # - magic_descriptor (https://github.com/ahupp/python-magic/pull/227)
    # - direct support for symlink flag
    magic_cookie = magic.magic_open(magic.MAGIC_SYMLINK)
    magic.magic_load(magic_cookie, None)
    try:
        fd_path = get_fd_path(stream)
        if fd_path:
            return magic.maybe_decode(magic.magic_file(magic_cookie, fd_path))
        else:
            # Handle BytesIO in-memory streams
            stream.seek(0, os.SEEK_SET)
            return magic.maybe_decode(magic.magic_buffer(magic_cookie, stream.read()))
    except magic.MagicException:
        # If libmagic fails, we fallback to 'data'
        return "data"
    finally:
        magic.magic_close(magic_cookie)


def calc_ssdeep(stream):
    return calc_hash(stream, ssdeep.Hash(), lambda h: h.digest())


def calc_crc32(stream):
    csum = None
    stream.seek(0, 0)

    chunk = stream.read(1024)
    if len(chunk) > 0:
        csum = crc32(chunk)

        while True:
            chunk = stream.read(1024)
            if len(chunk) > 0:
                csum = crc32(chunk, csum)
            else:
                break

    if csum is not None:
        csum = csum & 0xFFFFFFFF

    return "{:08x}".format(csum)


def paginate_fast(q, page, per_page):
    if page < 1:
        abort(404)

    if per_page < 0:
        abort(404)

    items = q.limit(per_page).offset((page - 1) * per_page).all()

    if not items and page != 1:
        abort(404)

    return Pagination(q, page, per_page, 0, items)


def is_true(flag):
    # "True", "true", "1"
    if isinstance(flag, str) and flag and flag.lower() in ["true", "1"]:
        return True
    # True, 1
    if (isinstance(flag, int) or isinstance(flag, bool)) and flag:
        return True
    return False


def is_subdir(parent, child):
    return os.path.commonpath([os.path.abspath(parent)]) == os.path.commonpath(
        [os.path.abspath(parent), os.path.abspath(child)]
    )


def get_s3_client(
    endpoint: str,
    access_key: str,
    secret_key: str,
    region: str,
    secure: bool,
    iam_auth: bool,
) -> botocore.client.BaseClient:
    if endpoint is None:
        raise RuntimeError("Attempting to get S3 client without an endpoint set")

    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        endpoint_url = endpoint
    else:
        # TODO: Remove secure flag and use explicit scheme only
        if secure is True:
            endpoint_url = "https://" + endpoint
        else:
            endpoint_url = "http://" + endpoint

    session_token = None

    if iam_auth:
        iam_providers = [
            ContainerProvider(),
            InstanceMetadataProvider(
                iam_role_fetcher=InstanceMetadataFetcher(timeout=1000, num_attempts=2)
            ),
        ]

        for provider in iam_providers:
            creds = provider.load()
            if creds:
                access_key = creds.access_key
                secret_key = creds.secret_key
                session_token = creds.token
                break

    if access_key is None or secret_key is None:
        raise RuntimeError(
            "Attempting to get S3 client without an access_key/secret_key set"
        )

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        aws_session_token=session_token,
        region_name=region,
    )
