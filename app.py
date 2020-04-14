import argparse
import click
import time

from plugin_engine import PluginAppContext, load_plugins

try:
    from secrets import token_hex
except ImportError:
    from os import urandom

    def token_hex(nbytes=None):
        return urandom(nbytes).hex()

from datetime import datetime

import sqlalchemy.exc
import logmatic

from flask import Flask, request, g, jsonify
from flask_migrate import Migrate
from werkzeug.exceptions import Forbidden, TooManyRequests

from model import db, User, Group, APIKey

from core.capabilities import Capabilities
from core.config import app_config
from core.service import setup_restful_service
from core.util import HashConverter
from core import log

from resources import requires_authorization

import logging

import redis

app = Flask(__name__)
migrate = Migrate(app, db)

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

db.init_app(app)

app.url_map.converters['hash64'] = HashConverter
api, spec = setup_restful_service(app)

logger = log.getLogger()

# Don't propagate to root logger
logger.propagate = False

# Setup JSON stream handler for main logger
handler = logging.StreamHandler()
handler.setFormatter(
    logmatic.JsonFormatter(fmt="%(filename) %(funcName) %(levelname) %(lineno) %(module) %(threadName) %(message)"))
logger.addHandler(handler)
logger.addFilter(log.ContextFilter())
logger.setLevel(logging.INFO)


@app.before_request
def assign_request_id():
    g.request_id = token_hex(16)
    g.request_start_time = datetime.utcnow()


@app.after_request
def log_request(response):
    response_time = datetime.utcnow() - g.request_start_time
    response_size = response.calculate_content_length()

    log.getLogger().info('request', extra={'path': request.path,
                                           'arguments': request.args,
                                           'method': request.method,
                                           'status': response.status_code,
                                           'response_time': response_time,
                                           'response_size': response_size})

    return response


def rate_limit(conn, key, duration, limit):
    class TooManyRequestsWithRetryAfter(TooManyRequests):
        def __init__(self, retry_after):
            self.retry_after = retry_after
            super().__init__("You are too fast. Wait {} seconds before next request.".format(retry_after))

        def get_headers(self, environ=None):
            return super().get_headers(environ=environ) + [("Retry-After", self.retry_after)]

    current_time = time.time()
    rate_key = "{}-{}:{}:{}".format(key, g.auth_user.login, duration, current_time // duration)
    count = conn.incr(rate_key)
    conn.expire(rate_key, duration)
    if count > limit:
        raise TooManyRequestsWithRetryAfter(duration - int(current_time % duration))


@app.before_request
def require_auth():
    if request.method == 'OPTIONS':
        return

    auth = request.headers.get('Authorization')

    g.auth_user = None

    if auth and auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1]
        g.auth_user = User.verify_session_token(token)
        # Not a session token? Maybe APIKey token
        if g.auth_user is None:
            g.auth_user = APIKey.verify_token(token)
        # Still nothing? Maybe legacy API key
        if g.auth_user is None:
            g.auth_user = User.verify_legacy_token(token)
            if g.auth_user is not None:
                log.getLogger().warning("'%s' used legacy auth token for authentication", g.auth_user.login)

    if g.auth_user:
        if app_config.malwarecage.enable_maintenance and g.auth_user.login != app_config.malwarecage.admin_login:
            raise Forbidden('Maintenance underway. Please come back later.')

        if g.auth_user.disabled:
            raise Forbidden("User has been disabled.")

        if app_config.malwarecage.enable_rate_limit and not g.auth_user.has_rights(Capabilities.unlimited_requests):
            """
            Single sample view in malwarefront generates 7 requests (6 GET, 1 POST)
            """
            conn = redis.from_url(app_config.malwarecage.redis_uri)
            if request.method == 'GET':
                """
                DownloadResource is token-based and shouldn't be limited
                """
                if request.endpoint != 'downloadresource':
                    # 1000 per 10 seconds
                    rate_limit(conn, "get-request", 10, 1000)
                    # 2000 per 1 minute
                    rate_limit(conn, "get-request", 60, 2000)
                    # 6000 per 5 minutes
                    rate_limit(conn, "get-request", 5 * 60, 6000)
                    # 10000 per 15 minutes
                    rate_limit(conn, "get-request", 15 * 60, 10000)
            else:
                # 10 per 10 seconds
                rate_limit(conn, "set-request", 10, 10)
                # 30 per 1 minute
                rate_limit(conn, "set-request", 60, 30)
                # 100 per 5 minutes
                rate_limit(conn, "set-request", 5 * 60, 100)
                # 200 per 15 minutes
                rate_limit(conn, "set-request", 15 * 60, 200)


@app.cli.command()
@click.argument('username')
@click.option('--expiration', default=3600, type=int, help='token expiration time in seconds')
def token(username, expiration):
    print(User.query.filter(User.login == username).one().generate_auth_token(expiration=expiration).decode('ascii'))


@app.cli.command()
@click.argument('name')
@click.argument('email')
@click.argument('password')
@click.option('--require-empty', default=False, is_flag=True)
def create_admin(name, email, password, require_empty):
    logger = log.getLogger()
    g.request_id = "cli"
    g.request_start_time = datetime.utcnow()

    if require_empty:
        if Group.query.count() > 0 and User.query.count() > 0:
            logger.info('Some users and groups already exist in the database. No changes were made.')
            return

    try:
        group = Group(name='public', capabilities=[])
        db.session.add(group)
        db.session.commit()
    except sqlalchemy.exc.IntegrityError:
        db.session.rollback()
        logger.exception('Group public already exists, no changes were made.')
    else:
        logger.info('Succesfully added group public"')

    try:
        group = Group(name=name, capabilities=Capabilities.all(), private=True)
        db.session.add(group)
        db.session.commit()
    except sqlalchemy.exc.IntegrityError:
        db.session.rollback()
        logger.exception('Group already exists, no changes were made.')
    else:
        logger.info('Succesfully added group %s', name)

    group = db.session.query(Group).filter(Group.name == name).first()

    try:
        user = User(login=name, email=email)
        user.set_password(password)
        user.version_uid = '0' * 16
        user.identity_ver = '0' * 16
        user.password_ver = '0' * 16
        user.groups.append(group)
        user.groups.append(Group.public_group())
        db.session.add(user)
        db.session.commit()
    except sqlalchemy.exc.IntegrityError:
        db.session.rollback()
        logger.exception('User already exists, no changes were made.')
    else:
        logger.info('Succesfully added admin user %s', name)


# Load plugins
plugin_context = PluginAppContext(app, api, spec)

with app.app_context():
    load_plugins(plugin_context)

spec_docs = spec.to_dict()


@app.route("/docs")
@requires_authorization
def docs():
    return jsonify(spec_docs)


# validate_spec(spec)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-H", "--host", help="Host to bind the API server on", default="localhost", action="store",
                        required=False)
    parser.add_argument("-p", "--port", help="Port to bind the API server on", default=8080, action="store",
                        required=False)
    args = parser.parse_args()
    app.run(host=args.host, port=args.port)
