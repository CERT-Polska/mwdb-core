import ast

from bottle import request, HTTPError

from db.config import Database as CDB
from db.malware import Database as MDB
from libs.web import app, jsonize, details

db = MDB()


class Dummy(object):
    def __init__(self, a, b):
        self.sha256 = a
        self.created_at = b


def wrap_to_dummy(x):
    return Dummy(*x)


def do_some_searching():
    sha1 = request.forms.get('sha1')
    md5 = request.forms.get("md5")
    sha256 = request.forms.get("sha256")

    if md5:
        row = db.find_md5(md5)
        if row:
            return row
        else:
            raise HTTPError(404, "File not found")
    elif sha256:
        row = db.find_sha256(sha256)
        if row:
            return row
        else:
            raise HTTPError(404, "File not found")

    elif sha1:
        row = db.find_sha1(sha1)
        if row:
            return row
        else:
            raise HTTPError(404, "File not found")

    else:
        ## ok first search for malware...
        rows = None
        for t in ['tag', 'date', 'ssdeep', 'file_name', 'file_size', 'file_type', 'config']:
            v = request.forms.get(t)
            if v:
                try:
                    vx = ast.literal_eval(v)
                except:
                    vx = v
                if t == 'config':
                    rows = db.config_samples(v)
                else:
                    rows = getattr(db, 'find_' + t)(vx)

        if rows: return rows

        ## lets try to search in configs...
        for k, v in request.forms.items():
            if k.startswith('config.') and v:
                try:
                    vx = ast.literal_eval(v)
                except:
                    vx = v
                rows = map(wrap_to_dummy, CDB().search(k[7:], vx))
                break

        if not rows:
            raise HTTPError(404, "File not found")

        return rows


@app.route('/search/full', method='POST')
def full_search():
    query = request.forms.get('query')
    r = db.full_search(query)
    return jsonize(map(lambda r: {'sha256': r.sha256, 'created_at': r.created_at.__str__()}, r))


@app.route("/search", method="POST")
def find_malware():
    r = do_some_searching()
    if type(r) == list:
        return jsonize(map(details, r))
    return jsonize(details(r))


@app.route("/search/simple", method="POST")
def find_malware():
    r = do_some_searching()
    return jsonize(map(lambda r: {'sha256': r.sha256, 'created_at': r.created_at.__str__()}, r))
