from bottle import request

from db import Database
from libs.web import app, has_params, jsonize
from libs.analysis import get_analysis_status

db = Database()


@app.route('/comment/add', method="POST")
@app.route('/comment/add/<hash>', method="POST")
@has_params
def comment(hash=None):
    cmt = request.forms.get('cmt')
    db.object_add_comment(hash, cmt)
    return jsonize({'success': True})


@app.route('/tag/add', method=["POST", "GET"])
@app.route('/tag/add/<hash>/<tag>', method="GET")
@has_params
def add_tag(hash=None, tag=None):
    m = db.object_get(hash)

    db.add_tag(m, tag)
    if tag.startswith('ripped:') or tag.startswith('contains:') and m.parent:
        ## propaget tags backwards
        x = tag.split(':', 1)[1]
        for p in m.parent:
            if 'archive' in p.tags:
                add_tag(hash=p, tag='contains:' + x)

    return jsonize({'success': True})


# @app.route("/tag/list", method="GET")
# def list_tags():
#     rows = db.list_tags()

#     results = []
#     for row in rows:
#         results.append(row.tag)

#     return jsonize(results)


@app.route('/task/<task_id>', method='GET')
@app.route('/task', method=['POST', 'GET'])
@has_params
def task(task_id):
    task = get_analysis_status(task_id)
    r = {'state': str(task.state)}
    if task.successful():
        r = task.result
    return jsonize(r)


@app.route('/vtcomms/recent', method='GET')
def recent_comms():
    r = []
    for cm in db.get_recent_vtcoms():
        r.append({
            'comment': cm.cmnt,
            'user': cm.user,
            'date': str(cm.date),
            'hash': cm.hash,
            'type': cm.type,
        })
    return jsonize(r)


@app.route('/email/add',method='POST')
def email_add():
    r  = request.json
    eml = db.email_add(r)
    return jsonize({'id':eml.id})
