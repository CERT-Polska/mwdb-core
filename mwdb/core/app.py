from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix

from mwdb.core.config import app_config

from .service import Service

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = app_config.mwdb.max_upload_size
api = Service(app)

if app_config.mwdb.use_x_forwarded_for:
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)
