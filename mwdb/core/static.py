import os

from flask import Blueprint, jsonify, send_from_directory
from werkzeug.utils import safe_join

from mwdb.paths import web_bundle_dir

from .config import app_config

web_folder = app_config.mwdb.web_folder or web_bundle_dir
static_blueprint = Blueprint("static", __name__)


@static_blueprint.route("/", defaults={"path": ""})
@static_blueprint.route("/<path:path>")
def serve_static(path):
    if path.startswith("api/"):
        return (
            jsonify(
                message="The requested URL was not found on the server. "
                "If you entered the URL manually please check your spelling "
                "and try again."
            ),
            404,
        )
    if path != "" and os.path.exists(safe_join(web_folder, path)):
        return send_from_directory(web_folder, path)
    return send_from_directory(web_folder, "index.html")
