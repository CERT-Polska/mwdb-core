from flask import Flask
from werkzeug.routing import BaseConverter

from core.config import app_config
from core.service import Service


class HashConverter(BaseConverter):
    # MD5/SHA1/SHA256/SHA512 (32,40,64,128)
    regex = '(root|[A-Fa-f0-9]{32,128})'


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = app_config.malwarecage.postgres_uri
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = app_config.malwarecage.secret_key
"""
Flask-restful tries to be smart and transforms NotFound exceptions.
Adds: "You have requested this URI [/file/root] but did you mean
/file/<string:identifier> or /file ?" even if URI is completely correct,
but some objects needed to fulfill request are missing.
"""
app.config["ERROR_404_HELP"] = False

# Load Flask-specific overrides if specified
if app_config.malwarecage.flask_config_file:
    app.config.from_pyfile(app_config.malwarecage.flask_config_file)

app.url_map.converters['hash64'] = HashConverter
api = Service(app)
