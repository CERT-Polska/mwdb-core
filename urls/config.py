from bottle import HTTPError, response

from db.config import Database as CDB
from db.malware import Database as MDB
from libs.web import app, has_params, low_details, jsonize

db = MDB()
configdb = CDB


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
    if db.can_cfg_be_shared(cfg):
        return jsonize(configdb().config(cfg))
    return HTTPError(403, 'No sample matching this config was shared with you')


@app.route('/config/raw', method=["POST", "GET"])
@app.route('/config/raw/<cfg>')
@has_params
def config_raw(cfg):
    response.content_type = 'text/plain'
    return configdb().from_gridfs(cfg)


@app.route('/config/recent', method='GET')
def config_recent():
    return jsonize(list(configdb().recent()))


@app.route('/config/stats', method='GET')
def config_stats():
    return jsonize(configdb().stats())
