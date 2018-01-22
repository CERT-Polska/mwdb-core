import ast
from bottle import request, HTTPError
from db import Database as MDB
from libs.web import app, jsonize, details


db = MDB()


class Dummy(object):
    def __init__(self, a, b):
        self.sha256 = a
        self.created_at = b


def wrap_to_dummy(x):
    return Dummy(*x)


def do_some_searching():

    md5    = request.forms.get("md5")
    sha1   = request.forms.get('sha1')
    sha256 = request.forms.get("sha256")
    name   = request.forms.get("name")


    ## basic search...
    rows = None
    for t in ('sha256',',md5','tag', 'config', 'date','sha1',
              'ssdeep', 'name', 'size', 'type', 'config','sha512'):
        v = request.forms.get(t)
        if v:

            try:
                vx = ast.literal_eval(v)
            except:
                vx = v
                
            if t == 'config':
                rows = db.config_samples(v)
            elif t == 'tag':
                rows = db.tag_find_tagged(v)
            elif t == 'name':
                rows = db.name_find_named(v)
            else:
                rows = getattr(db, 'object_find_' + t)(vx)
            
            if rows:
                return rows

    # lets try to search in configs...
    for k, v in request.forms.items():
        if k.startswith('config.') and v:
            try:
                vx = ast.literal_eval(v)
            except:
                vx = v
            rows = map(wrap_to_dummy, db.config_search(k[7:], v))
            break

    if not rows:
        raise HTTPError(404, "File not found")

    return rows


@app.route('/search/full', method='POST')
def full_search():
    query = request.forms.get('query')
    r = db.full_search(query)
    return jsonize(map(lambda r: {'sha256': r.sha256, 'timestamp': r.timestamp}, r))


@app.route("/search", method="POST")
def find_malware():
    r = do_some_searching()
    if type(r) == list:
        return jsonize(map(details, r))
    return jsonize(details(r))


@app.route("/search/simple", method="POST")
def find_malware():
    ret = r = do_some_searching()
    if type(r) == list:
        ret = map(lambda r: r._view, r)
    elif type(r) == dict:
        ret = []
        for t,elems in r.items():
            t = t[:-1]
            ret.append(map(lambda x: [t] + list(x._view),elems))
        ret= sum(ret,[])
    return jsonize(ret)
