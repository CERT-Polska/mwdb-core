import os

from flask import Blueprint, safe_join, send_from_directory

from mwdb.paths import web_bundle_dir

from .config import app_config

web_folder = app_config.mwdb.web_folder or web_bundle_dir
static_blueprint = Blueprint("static", __name__)


@static_blueprint.route("/", defaults={"path": ""})
@static_blueprint.route("/<path:path>")
def serve_static(path):
    if path != "" and os.path.exists(safe_join(web_folder, path)):
        return send_from_directory(web_folder, path)
    elif not path.startswith("api"):
        return send_from_directory(web_folder, "index.html")
