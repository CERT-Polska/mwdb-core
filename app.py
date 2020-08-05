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

from flask import request, g
from flask_migrate import Migrate
from werkzeug.exceptions import Forbidden, TooManyRequests

from model import db, User, Group, APIKey

from core.app import app, api
from core.capabilities import Capabilities
from core.config import app_config
from core import log

from resources.api_key import APIKeyResource, APIKeyIssueResource
from resources.auth import (
    LoginResource, ChangePasswordResource,
    RefreshTokenResource, RegisterResource,
    RecoverPasswordResource, RequestPasswordChangeResource,
    ValidateTokenResource, ProfileResource
)

from resources.blob import TextBlobResource, TextBlobListResource
from resources.comment import CommentResource, CommentDeleteResource
from resources.config import ConfigResource, ConfigListResource, ConfigStatsResource
from resources.download import RequestSampleDownloadResource, DownloadResource
from resources.file import FileResource, FileListResource
from resources.group import GroupResource, GroupListResource, GroupMemberResource
from resources.metakey import (
    MetakeyResource, MetakeyListDefinitionResource,
    MetakeyDefinitionManageResource, MetakeyListDefinitionManageResource,
    MetakeyPermissionResource
)
from resources.object import ObjectResource, ObjectListResource
from resources.relations import RelationsResource, ObjectChildResource
from resources.server import PingResource, ServerInfoResource, ServerDocsResource
from resources.search import SearchResource
from resources.share import ShareGroupListResource, ShareResource
from resources.tag import TagResource, TagListResource
from resources.user import (
    UserResource, UserListResource, UserPendingResource,
    UserGetPasswordChangeTokenResource
)
from resources.query import QueryResource, QueryUpdateResource, QueriesGetResource

import redis

migrate = Migrate(app, db)
db.init_app(app)


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
        user = User(login=name,
                    email=email,
                    additional_info="Malwarecage built-in administration account")
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


# Server health endpoints
api.add_resource(PingResource, '/ping')
api.add_resource(ServerInfoResource, '/server')
api.add_resource(ServerDocsResource, '/docs')

# Authentication endpoints
api.add_resource(LoginResource, '/auth/login')
api.add_resource(ChangePasswordResource, "/auth/change_password")
api.add_resource(RecoverPasswordResource, '/auth/recover_password')
api.add_resource(RequestPasswordChangeResource, '/auth/request_password_change')
api.add_resource(RefreshTokenResource, "/auth/refresh")
api.add_resource(ValidateTokenResource, "/auth/validate")
api.add_resource(ProfileResource, "/auth/profile")
api.add_resource(RegisterResource, '/auth/register')

# API key endpoints
api.add_resource(APIKeyIssueResource, "/user/<login>/api_key")
api.add_resource(APIKeyResource, "/api_key/<api_key_id>")

# Object endpoints
api.add_resource(ObjectListResource, '/object')
api.add_resource(ObjectResource, '/object/<hash64:identifier>')

# Tag endpoints
api.add_resource(TagListResource, '/tag')
api.add_resource(TagResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/tag')

# Comment endpoints
api.add_resource(CommentResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/comment')
api.add_resource(CommentDeleteResource,
                 '/<any(file, config, blob, object):type>/<hash64:identifier>/comment/<int:comment_id>')

# Share endpoints
api.add_resource(ShareResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/share')
api.add_resource(ShareGroupListResource, '/share')

# Relation endpoints
api.add_resource(RelationsResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/relations')
api.add_resource(ObjectChildResource,
                 '/<any(file, config, blob, object):type>/<hash64:parent>/child/<hash64:child>')

# File endpoints
api.add_resource(FileListResource, '/file')
api.add_resource(FileResource, '/file/<hash64:identifier>')

# Config endpoints
api.add_resource(ConfigListResource, '/config')
api.add_resource(ConfigStatsResource, '/config/stats')
api.add_resource(ConfigResource, '/config/<hash64:identifier>')

# Blob endpoints
api.add_resource(TextBlobListResource, '/blob')
api.add_resource(TextBlobResource, '/blob/<hash64:identifier>')

# Download endpoints
api.add_resource(RequestSampleDownloadResource, '/request/sample/<identifier>')
api.add_resource(DownloadResource, '/download/<access_token>')

# Search endpoints
api.add_resource(SearchResource, '/search')

# Query endpoints
api.add_resource(QueryResource, "/query")
api.add_resource(QueriesGetResource, "/<any(file, config, blob, object):type>/query")
api.add_resource(QueryUpdateResource, "/query/<int:id>")

# Metakey endpoints
api.add_resource(MetakeyListDefinitionResource, '/meta/list/<any(read, set):access>')
api.add_resource(MetakeyResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/meta')
api.add_resource(MetakeyListDefinitionManageResource, '/meta/manage')
api.add_resource(MetakeyDefinitionManageResource, '/meta/manage/<key>')
api.add_resource(MetakeyPermissionResource, '/meta/manage/<key>/permissions/<group_name>')

# User endpoints
api.add_resource(UserListResource, "/user")
api.add_resource(UserResource, "/user/<login>")
api.add_resource(UserGetPasswordChangeTokenResource, "/user/<login>/change_password")
api.add_resource(UserPendingResource, "/user/<login>/pending")

# Group endpoints
api.add_resource(GroupListResource, "/group")
api.add_resource(GroupResource, "/group/<name>")
api.add_resource(GroupMemberResource, '/group/<name>/member/<login>')

# Load plugins
plugin_context = PluginAppContext()

with app.app_context():
    load_plugins(plugin_context)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-H", "--host", help="Host to bind the API server on", default="localhost", action="store",
                        required=False)
    parser.add_argument("-p", "--port", help="Port to bind the API server on", default=8080, action="store",
                        required=False)
    args = parser.parse_args()
    app.run(host=args.host, port=args.port)
