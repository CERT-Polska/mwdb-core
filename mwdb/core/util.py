import os

try:
    from secrets import token_hex
except ImportError:
    from os import urandom

    def token_hex(nbytes=None):
        return urandom(nbytes).hex()

import magic
import ssdeep

from zlib import crc32

from flask_restful import abort
from flask_sqlalchemy import Pagination
import hashlib


def config_dhash(obj):
    if isinstance(obj, list):
        return config_dhash(
            str(sorted([config_dhash(o) for o in obj])))
    elif isinstance(obj, dict):
        return config_dhash([[o, config_dhash(obj[o])] for o in sorted(obj.keys())])
    else:
        return hashlib.sha256(bytes(str(obj), 'utf-8')).hexdigest()


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
    return traverse(obj, lambda o: o.encode("unicode_escape").decode("utf-8") if isinstance(o, str) else o)


def config_decode(obj):
    return traverse(obj, lambda o: bytes(o, "utf-8").decode("unicode_escape") if isinstance(o, str) else o)


def calc_hash(stream, hash_obj, digest_cb):
    stream.seek(0, os.SEEK_SET)

    for chunk in iter(lambda: stream.read(128 * 1024), b''):
        hash_obj.update(chunk)

    return digest_cb(hash_obj)


def calc_magic(stream):
    stream.seek(0, os.SEEK_SET)
    return magic.from_buffer(stream.read())


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
        csum = csum & 0xffffffff

    return '{:x}'.format(csum)


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
