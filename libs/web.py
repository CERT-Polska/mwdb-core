#!/usr/bin/env python
# -*- coding: utf-8 -*-
import functools, json
from bottle import Bottle, request, response
from datetime import date, datetime

from db import Database
from libs.objects import Config

app = application = Bottle()
db = Database()


def has_params(f):
    @functools.wraps(f)
    def worker(*a, **kwargs):
        for kw in f.func_code.co_varnames[:f.func_code.co_argcount]:
            if kw not in kwargs:
                kwargs[kw] = request.params.get(kw)
        return f(*a, **kwargs)

    return worker


def get_user():
    return (request.auth or [Config().api.default_user])[0]


@app.hook('before_request')
def set_user():
    db.set_user(get_user())


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, (datetime, date)):
        return obj.isoformat()

    if hasattr(obj,'_view'):
        return obj._view
    
    raise TypeError ("Type %s not serializable" % type(obj))

    
def jsonize(data):
    response.content_type = 'application/json'
    return json.dumps(data, sort_keys=True,default=json_serial)


def details(row):
    entry = {
        "id": row.id,
        "file_names": row.names,
        "file_type": row.type,
        "file_size": row.size,
        "md5": row.md5,
        "sha1": row.sha1,
        "sha256": row.sha256,
        "sha512": row.sha512,
        "crc32": row.crc32,
        "ssdeep": row.ssdeep,
        "timestamp": row.timestamp,
        "tags": row.tags,
        "childrens": map(lambda x: {'hash': x.sha1, 'tags': x.tags, 'timestamp': x.timestamp.__str__()}, row.children),
        "parents": map(lambda x: {'hash': x.sha1, 'tags': x.tags, 'timestamp': x.timestamp.__str__()}, row.parent),
        "comment": row.comment,
        "static_config": row.config.id if row.config else None,
#        "cuckoo_ids": map(lambda x: x.id, row.cuckoo)
    }
    return entry


def low_details(row):
    entry = {
        "file_names": row.names,
        "file_type": row.type,
        "file_size": row.size,
        "md5": row.md5,
        "sha256": row.sha256,
        "timestamp": row.timestamp.__str__(),
        "tags": row.tags,
        #map(lambda x:x.tag,row.tag),

        "children": map(lambda x: x.md5, row.children),
        "parents": map(lambda x: x.md5, row.parent),
    }
    return entry


def inspect_routes(app):
    for route in app.routes:
        if 'mountpoint' in route.config:
            prefix = route.config['mountpoint']['prefix']
            subapp = route.config['mountpoint']['target']

            for prefixes, route in inspect_routes(subapp):
                yield [prefix] + prefixes, route
        else:
            yield [], route
