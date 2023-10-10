from flask import Blueprint, Flask
from werkzeug.middleware.proxy_fix import ProxyFix

from mwdb.core.config import app_config
from mwdb.core.rate_limit import limiter

from .service import Service

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = app_config.mwdb.max_upload_size
api_blueprint = Blueprint("api", __name__, url_prefix="/api")
api = Service(app, api_blueprint)
app.register_blueprint(api_blueprint)

if app_config.mwdb.use_x_forwarded_for:
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)

limiter.init_app(app)
