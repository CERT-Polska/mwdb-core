import os
import ast
import json
import hashlib

from bottle import request, response
from bottle import HTTPError,static_file

import libs.analysis as anal

from db.base import InsertRet
from libs.extractor import extract
from libs.objects import File, Config
from libs.repository import store_sample, get_sample_path, file_name, is_raw_ext
from libs.web import *
from libs.objects import Config



def _add_malware():
    tags = request.forms.get("tags")
    cmt = request.forms.get('cmt')
    sharable = json.loads(request.forms.get('share', 'true'))
    do_extrct = json.loads(request.forms.get('extract', 'true'))

    data = request.files.file
    filename = data.filename
    data_b = data.file.read()

    if anal.check_and_process_email(filename, data_b):
        return {'error': 'email'}

    info = File(file_path=store_sample(data_b))
#    have_sims = db.have_similar(info)
    ret, p = db.object_add(obj=info, file_name=data.filename, tags=tags,
                    comment=cmt, sharable=sharable)
    is_archive = False
    if ret != InsertRet.duplicate and do_extrct and not p.children \
       and not os.path.splitext(filename)[-1] in ['.doc', '.docm', '.xls', '.xlsm', '.docx']:

        for inf in extract(filename, data_b):

            if not inf.f.filesize:
                continue

            if anal.check_and_process_email(inf.filename, inf.data):
                continue

            if not inf.filename.strip() and ('spam' in tags ):
                # kovter+locky spam...
                continue

            f = File(file_path=store_sample(inf.data))
            # inherit from parent
            cmt2 = cmt
            if inf.comment:
                cmt2 += "\n" + inf.comment

            t = (tags if tags else '') + \
                (',' + ','.join(inf.tags) if inf.tags else '')
            r, x = db.object_add(obj=f, file_name=inf.filename, tags=t,
                          comment=cmt2, sharable=sharable)
            if x:
                db.object_add_xref(p if p.sha256 == inf.parent else inf.parent, x)

            is_archive = True

    if ret == InsertRet.error:
        raise HTTPError(500, "Database error")

    if is_archive:
        db.object_add_tag(p, 'archive')

    return {"filepath": info.file_path.replace(Config().api.repository, ''), "duplicate": ret == InsertRet.duplicate}


@app.route("/file/recent/<max:int>")
@app.route("/file/recent")
def recent(max=100):
    return jsonize(map(low_details, db.object_recent(max)))


@app.route("/file/add_cuckoo", method='POST')
def add_cuckoo():
    cid = request.forms.get('cid')
    mid = request.forms.get('hash')
#    print `mid`,`cid`
    db.add_cuckoo(mid, cid)
    return jsonize({'success': True})


@app.route('/file/add_xref', method='POST')
def add_xref():
    pid = request.forms.get('parent')
    cid = request.forms.get('child')
    db.object_add_xref(pid, cid)
    return jsonize({'success': True})


@app.route("/file/add", method="POST")
def add_malware():
    return jsonize(_add_malware())


@app.route("/file/get/<sha256>", method="GET")
def get_malware(sha256):
    if len(sha256) != 64:
        obj = db.object_get(sha256)
        if not obj:
            raise HTTPError(404, "File not found")
        sha256 = obj.sha256
        
    path = get_sample_path(sha256)
    if not path:
        raise HTTPError(404, "File not found")

    return static_file(path,root='/',mimetype="application/octet-stream; charset=UTF-8")
    # response.content_length = os.path.getsize(path)
    # response.content_type = "application/octet-stream; charset=UTF-8"
    # with open(path, "rb") as f:
    #     data = f.read()

    # return data


@app.route("/file/ancestors", method=["GET", "POST"])
@app.route("/file/ancestors/<hash>", method="GET")
@has_params
def get_ancestors(hash=None):
    m = db.object_get(hash)
    return jsonize(map(low_details, m.ancestors()))


@app.route("/file/descendants", method=["GET", "POST"])
@app.route("/file/descendants/<hash>", method="GET")
@has_params
def get_descendants(hash=None):
    m = db.object_get(hash)
    return jsonize(map(low_details, m.descendants()))


@app.route("/file/sample", method=["GET", "POST"])
@app.route("/file/sample/<hash>", method="GET")
@app.route("/file/sample/<id:int>", method="GET")

@has_params
def get_sample(hash=None,id=-1):
    row = db.object_get(hash or id)
    if row:
        return jsonize(details(row))
    raise HTTPError(404, "File not found")


@app.route('/file/analyze/<hash>', method='GET')
@app.route('/file/analyze', method=['GET', 'POST'])
@has_params
def submit_md5(hash):
    ctx = {}
    ctx['_dont_run'] = json.loads(
        request.forms.get('dont_run', 'False').lower())
    ctx['_base'] = int(request.forms.get('_base', '0'), 16)
    ctx['_memdump'] = json.loads(request.forms.get('memdump', 'False').lower())
    ctx['_raw'] = json.loads(request.forms.get('_raw', 'False').lower())
    m = db.object_get(hash)
    if not m:
        return HTTPError(404, 'No sample with such hash')

    ctx['_data'] = {'path': get_sample_path(m.sha256)}
    ctx['_hash'] = m.sha256
    ctx['_name'] = file_name(m)
    ctx['tags'] = filter(None, request.forms.get('tag', '').strip().split(','))
    # print os.path.splitext(ctx['_name'])[1].lower()
    # print RAW_EXT
    if is_raw_ext(ctx['_name']):
        ctx['_raw'] = True
    cmd = anal.analyze_sample(ctx)
    return jsonize({'task_id': cmd.task_id })


@app.route('/bytes/find/<needle>', method='GET')
@app.route('/bytes/find', method=['GET', 'POST'])
@has_params
def bytes_find(needle):
    needle = needle.decode('hex')
    return jsonize(map(low_details, db.find_bytes(needle)))
