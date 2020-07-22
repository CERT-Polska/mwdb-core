from functools import partial

from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin

from flask_restful import Api
from werkzeug.exceptions import HTTPException

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
from resources.object import ObjectResource, ObjectListResource, ObjectChildResource
from resources.relations import RelationsResource
from resources.server import PingResource, ServerInfoResource
from resources.search import SearchResource
from resources.share import ShareGroupListResource, ShareResource
from resources.tag import TagResource, TagListResource
from resources.user import (
    UserResource, UserListResource, UserPendingResource,
    UserGetPasswordChangeTokenResource
)

from . import log
from .apispec_utils import ApispecFlaskRestful

from version import app_version


class Service(Api):
    def _init_app(self, app):
        # I want to log exceptions on my own
        def dont_log(*_, **__):
            pass
        app.log_exception = dont_log
        if isinstance(app.handle_exception, partial) and app.handle_exception.func is self.error_router:
            # Prevent double-initialization
            return
        super()._init_app(app)

    def error_router(self, original_handler, e):
        logger = log.getLogger()
        if isinstance(e, HTTPException):
            logger.error(str(e))
        else:
            logger.exception("Unhandled exception occurred")

        # Handle all exceptions using handle_error, not only for owned routes
        try:
            return self.handle_error(e)
        except Exception:
            logger.exception("Exception from handle_error occurred")
            pass
        # If something went wrong - fallback to original behavior
        return super().error_router(original_handler, e)


app_description = """
Malwarecage API documentation.

If you want to automate things, we recommend using <a href="http://github.com/CERT-Polska/mwdblib">mwdblib library</a>
"""


def get_url_for(app, resource, **params):
    return Service.url_for(Service(app), resource, **params)


def setup_restful_service(app):
    api = Service(app)

    spec = APISpec(title='Malwarecage',
                   version=app_version,
                   openapi_version='3.0.2',
                   plugins=[ApispecFlaskRestful(), MarshmallowPlugin()],
                   info={'description': app_description})

    spec.components.security_scheme('bearerAuth', {
        'type': 'http',
        'scheme': 'bearer',
        'bearerFormat': 'JWT'
    })

    spec.options["servers"] = [
        {
            "url": "{scheme}://{host}/api",
            "description": 'Malwarecage API endpoint',
            "variables": {
                "scheme": {
                    "enum": ["http", "https"],
                    "default": "https"
                },
                "host": {
                    "default": "mwdb.cert.pl"
                },
            }
        }
    ]

    # Server health endpoints
    api.add_resource(PingResource, '/ping')
    spec.path(resource=PingResource, api=api)
    api.add_resource(ServerInfoResource, '/server')
    spec.path(resource=ServerInfoResource, api=api)

    # Authentication endpoints
    api.add_resource(LoginResource, '/auth/login')
    spec.path(resource=LoginResource, api=api)
    api.add_resource(ChangePasswordResource, "/auth/change_password")
    spec.path(resource=ChangePasswordResource, api=api)
    api.add_resource(RecoverPasswordResource, '/auth/recover_password')
    spec.path(resource=RecoverPasswordResource, api=api)
    api.add_resource(RequestPasswordChangeResource, '/auth/request_password_change')
    spec.path(resource=RequestPasswordChangeResource, api=api)
    api.add_resource(RefreshTokenResource, "/auth/refresh")
    spec.path(resource=RefreshTokenResource, api=api)
    api.add_resource(ValidateTokenResource, "/auth/validate")
    spec.path(resource=ValidateTokenResource, api=api)
    api.add_resource(ProfileResource, "/auth/profile")
    spec.path(resource=ProfileResource, api=api)
    api.add_resource(RegisterResource, '/auth/register')
    spec.path(resource=RegisterResource, api=api)

    # Object endpoints
    api.add_resource(ObjectListResource, '/object')
    spec.path(resource=ObjectListResource, api=api)
    api.add_resource(ObjectResource, '/object/<hash64:identifier>')
    spec.path(resource=ObjectResource, api=api)
    api.add_resource(CommentDeleteResource,
                     '/<any(file, config, blob, object):type>/<hash64:identifier>/comment/<int:comment_id>',
                     endpoint="removecomment")
    spec.path(resource=CommentDeleteResource, api=api)
    api.add_resource(CommentResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/comment')
    spec.path(resource=CommentResource, api=api)
    api.add_resource(TagResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/tag')
    spec.path(resource=TagResource, api=api)
    api.add_resource(ShareResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/share')
    spec.path(resource=ShareResource, api=api)
    api.add_resource(ShareGroupListResource, '/share')
    spec.path(resource=ShareGroupListResource, api=api)
    api.add_resource(MetakeyResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/meta')
    spec.path(resource=MetakeyResource, api=api)
    api.add_resource(ObjectChildResource,
                     '/<any(file, config, blob, object):type>/<hash64:parent>/child/<hash64:child>')
    spec.path(resource=ObjectChildResource, api=api)
    api.add_resource(RelationsResource, '/<any(file, config, blob, object):type>/<hash64:identifier>/relations')
    spec.path(resource=RelationsResource, api=api)

    # Tag endpoints
    api.add_resource(TagListResource, '/tag')
    spec.path(resource=TagListResource, api=api)

    # File endpoints
    api.add_resource(FileListResource, '/file')
    spec.path(resource=FileListResource, api=api)
    api.add_resource(FileResource, '/file/<hash64:identifier>')
    spec.path(resource=FileResource, api=api)

    # Config endpoints
    api.add_resource(ConfigListResource, '/config')
    spec.path(resource=ConfigListResource, api=api)
    api.add_resource(ConfigStatsResource, '/config/stats')
    spec.path(resource=ConfigStatsResource, api=api)
    api.add_resource(ConfigResource, '/config/<hash64:identifier>')
    spec.path(resource=ConfigResource, api=api)

    # Blob endpoints
    api.add_resource(TextBlobListResource, '/blob')
    spec.path(resource=TextBlobListResource, api=api)
    api.add_resource(TextBlobResource, '/blob/<hash64:identifier>')
    spec.path(resource=TextBlobResource, api=api)

    # Download endpoints
    api.add_resource(RequestSampleDownloadResource, '/request/sample/<identifier>')
    spec.path(resource=RequestSampleDownloadResource, api=api)
    api.add_resource(DownloadResource, '/download/<access_token>')
    spec.path(resource=DownloadResource, api=api)

    # Search endpoints
    api.add_resource(SearchResource, '/search')
    spec.path(resource=SearchResource, api=api)

    # Metakey endpoints
    api.add_resource(MetakeyListDefinitionResource, '/meta/list/<access>')
    spec.path(resource=MetakeyListDefinitionResource, api=api)
    api.add_resource(MetakeyListDefinitionManageResource, '/meta/manage')
    spec.path(resource=MetakeyListDefinitionManageResource, api=api)
    api.add_resource(MetakeyDefinitionManageResource, '/meta/manage/<key>')
    spec.path(resource=MetakeyDefinitionManageResource, api=api)
    api.add_resource(MetakeyPermissionResource, '/meta/manage/<key>/permissions/<group_name>')
    spec.path(resource=MetakeyPermissionResource, api=api)

    # User endpoints
    api.add_resource(UserListResource, "/user")
    spec.path(resource=UserListResource, api=api)
    api.add_resource(UserResource, "/user/<login>")
    spec.path(resource=UserResource, api=api)
    api.add_resource(UserGetPasswordChangeTokenResource, "/user/<login>/change_password")
    spec.path(resource=UserGetPasswordChangeTokenResource, api=api)
    api.add_resource(UserPendingResource, "/user/<login>/pending")
    spec.path(resource=UserPendingResource, api=api)

    # API key endpoints
    api.add_resource(APIKeyIssueResource, "/user/<login>/api_key")
    spec.path(resource=APIKeyIssueResource, api=api)
    api.add_resource(APIKeyResource, "/api_key/<api_key_id>")
    spec.path(resource=APIKeyResource, api=api)

    # Group endpoints
    api.add_resource(GroupListResource, "/group")
    spec.path(resource=GroupListResource, api=api)
    api.add_resource(GroupResource, "/group/<name>")
    spec.path(resource=GroupResource, api=api)
    api.add_resource(GroupMemberResource, '/group/<name>/member/<login>')
    spec.path(resource=GroupMemberResource, api=api)
    return api, spec
