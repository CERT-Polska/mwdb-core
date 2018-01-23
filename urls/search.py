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

    ret_template = {
        'ip'    : [],        
        'url'   : [],
        'email' : [],
        'domain': [],
        'object': [],
        'config': [],
    }
    
    ## basic search...
    rows = None
    for t in ('sha256',',md5','tag', 'config', 'date','sha1',
              'ssdeep', 'name', 'size', 'type', 'config','sha512',
              'email'):
        v = request.forms.get(t)
        if v:

            try:
                vx = ast.literal_eval(v)
            except:
                vx = v
                
            if t == 'config':
                rows = list(db.config_samples(v))
                t = 'object'
                print rows,type(rows)
                
            elif t == 'tag':
                rows = db.tag_find_tagged(v)
                
            elif t == 'name':
                rows = db.name_find_named(v)
                
            elif t == 'email':
                rows  = db.email_search_text(v)
            else:
                rows = getattr(db, 'object_find_' + t)(vx)
                t = 'object'
                
            if rows and type(rows) == list:
                ret_template[t] = rows
            if rows and type(rows) == dict:
                ret_template.update(rows)
                
    # lets try to search in configs...
    for k, v in request.forms.items():
        if not v:
            continue
        try:
            vx = ast.literal_eval(v)
        except:
            vx = v
            
        if k.startswith('config.'):
            rows = db.config_search(k[7:], vx)
            ret_template['config'] = rows
            break
        # elif k.startswith('email.'):
        #     rows = db.config_search(k[7:], vx)
        #     break

    if not rows:
        raise HTTPError(404, "File not found")

    return ret_template


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
    return jsonize(do_some_searching())
