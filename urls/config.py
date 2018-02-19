from bottle import HTTPError, response,request

from db import Database
from libs.web import app, has_params, low_details, jsonize

db = Database()
#configdb = CDB


@app.route('/config/samples', method=["POST", "GET"])
@app.route('/config/samples/<cfg>')
@has_params
def config_samples(cfg):
    smpls = db.config_samples(cfg)
    return jsonize(map(low_details, smpls))


@app.route('/config/shared', method=["POST", "GET"])
@app.route('/config/shared/<cfg>')
@has_params
def config_shared(cfg):
    return jsonize({'shared': db.can_cfg_be_shared(cfg)})


@app.route('/config/get', method=["POST", "GET"])
@app.route('/config/get/<cfg>')
@has_params
def config_get(cfg):
    return jsonize(db.config_get(cfg).to_dict())

# @app.route('/config/raw', method=["POST", "GET"])
# @app.route('/config/raw/<cfg>')
# @has_params
# def config_raw(cfg):
#     response.content_type = 'text/plain'
#     return configdb().from_gridfs(cfg)


@app.route('/config/recent/<max:int>', method=["POST", "GET"])
@app.route('/config/recent', method='GET')
@has_params
def config_recent(m):
    r = [(c.id,c.type,c.cncs,c.timestamp) for c in db.config_recent(m)] 
    return jsonize(r)


@app.route('/config/stats', method='GET')
def config_stats():
    return jsonize(db.config_stats())


@app.route('/config/add',method='POST')
@app.route('/config/add/<hash>',method='POST')
def config_add(hash=None):
    cfg = db.config_add(request.json,hash)
    return jsonize({'id':cfg.id})
