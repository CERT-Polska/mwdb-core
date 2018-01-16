from db.malware import Database
from libs.web import app, low_details, jsonize

db = Database()


@app.route('/user/samples', method=["GET"])
def config_samples():
    smpls = db.user_samples()
    return jsonize(map(low_details, smpls))
