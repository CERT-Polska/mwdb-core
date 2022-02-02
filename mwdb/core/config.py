import os
from enum import Enum
from typing import List, Optional

from typedconfig import Config, group_key, key, section
from typedconfig.source import EnvironmentConfigSource, IniFileConfigSource

from mwdb.paths import mail_templates_dir


def intbool(v) -> bool:
    return bool(int(v))


def list_of_str(v) -> List[str]:
    return [el.strip() for el in v.split(",") if el.strip()]


def path(v) -> Optional[str]:
    if not v:
        return None
    v = os.path.abspath(v)
    if not os.path.exists(v):
        raise ValueError(f"Path {v} doesn't exist")
    return v


class StorageProviderType(Enum):
    DISK = "DISK"
    S3 = "S3"


def storage_provider_from_str(v: str) -> Optional[StorageProviderType]:
    if not v:
        return None

    v = v.upper()
    try:
        return StorageProviderType[v]
    except KeyError:
        raise ValueError(f"Storage provider {v} doesn't exist")


@section("mwdb")
class MWDBConfig(Config):
    # PostgreSQL database URI
    postgres_uri = key(cast=str, required=True)
    # PostgreSQL database statement_timeout parameter
    statement_timeout = key(cast=int, required=False, default=0)
    # Flask secret key
    secret_key = key(cast=str, required=True)
    # Redis database URI
    redis_uri = key(cast=str, required=False, default=None)
    # Serve web application
    serve_web = key(cast=intbool, required=False, default=True)
    # Folder with web application files
    # (if not set: served from pre-built package bundle)
    web_folder = key(cast=path, required=False, default=None)
    # Base application URL, accessible for users
    base_url = key(cast=str, required=False, default="http://127.0.0.1")
    # Flask additional settings file (optional)
    flask_config_file = key(cast=path, required=False)
    # Axios request timeout
    request_timeout = key(cast=int, required=False, default=20000)
    # Which storage provider to use (options: disk or s3)
    storage_provider = key(
        cast=storage_provider_from_str, required=False, default="disk"
    )
    # File upload timeout
    file_upload_timeout = key(cast=int, required=False, default=60000)
    # Folder for uploads
    uploads_folder = key(cast=path, required=False)
    # Should we break up the uploads into different folders for example:
    # uploads/9/f/8/6/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
    hash_pathing = key(cast=intbool, required=False, default=True)
    # S3 compatible storage endpoint
    s3_storage_endpoint = key(cast=str, required=False)
    # Use TLS with S3 storage
    s3_storage_secure = key(cast=intbool, required=False, default=False)
    # S3 storage Access Key
    s3_storage_access_key = key(cast=str, required=False)
    # S3 storage Secret Key
    s3_storage_secret_key = key(cast=str, required=False)
    # S3 storage Region Name (For example, 'us-east-1')
    s3_storage_region_name = key(cast=str, required=False)
    # S3 storage Bucket Name
    s3_storage_bucket_name = key(cast=str, required=False)
    # S3 storage Authorize through IAM role (No credentials)
    s3_storage_iam_auth = key(cast=intbool, required=False)

    # Administrator account login
    admin_login = key(cast=str, required=False, default="admin")
    # Administrator account first password
    admin_password = key(cast=str, required=False)

    enable_plugins = key(cast=intbool, required=False, default=True)
    # List of plugin names to be loaded, separated by commas
    plugins = key(cast=list_of_str, required=False, default="")
    # Directory that will be added to sys.path for plugin imports
    # Allows to load local plugins without installing them in site-packages
    local_plugins_folder = key(cast=path, required=False, default=None)
    # Auto-discover plugins contained in local_plugins_folder
    local_plugins_autodiscover = key(cast=intbool, required=False, default=False)

    remotes = key(cast=list_of_str, required=False, default="")

    enable_rate_limit = key(cast=intbool, required=False, default=False)
    enable_registration = key(cast=intbool, required=False, default=False)
    enable_maintenance = key(cast=intbool, required=False, default=False)
    enable_hooks = key(cast=intbool, required=False, default=True)
    enable_karton = key(cast=intbool, required=False, default=False)
    # Feature flag: OIDC is under development
    enable_oidc = key(cast=intbool, required=False, default=False)

    mail_smtp = key(cast=str, required=False)
    mail_from = key(cast=str, required=False, default="noreply@mwdb")
    mail_templates_folder = key(cast=path, required=False, default=mail_templates_dir)
    mail_username = key(cast=str, required=False)
    mail_password = key(cast=str, required=False)
    mail_tls = key(cast=intbool, required=False, default=False)

    recaptcha_site_key = key(cast=str, required=False)
    recaptcha_secret = key(cast=str, required=False)

    enable_json_logger = key(cast=intbool, required=False, default=False)


@section("karton")
class KartonConfig(Config):
    config_path = key(cast=str, required=False, default=None)


@section("mwdb_limiter")
class MwdbLimiterConfig(Config):
    # APIKeyIssueResource
    apikeyissue_post = key(cast=str, required=False, default=None)

    # APIKeyResource
    apikey_get = key(cast=str, required=False, default=None)
    apikey_delete = key(cast=str, required=False, default=None)

    # AttributeListResource
    attributelist_get = key(cast=str, required=False, default=None)
    attributelist_post = key(cast=str, required=False, default=None)

    # AttributeResource
    attribute_delete = key(cast=str, required=False, default=None)

    # AttributeDefinitionListResource
    attributedefinitionlist_get = key(cast=str, required=False, default=None)
    attributedefinitionlist_post = key(cast=str, required=False, default=None)

    # AttributeDefinitionResource
    attributedefinition_get = key(cast=str, required=False, default=None)
    attributedefinition_put = key(cast=str, required=False, default=None)
    attributedefinition_delete = key(cast=str, required=False, default=None)

    # AttributePermissionResource
    attributepermission_get = key(cast=str, required=False, default=None)
    attributepermission_put = key(cast=str, required=False, default=None)
    attributepermission_delete = key(cast=str, required=False, default=None)

    # RequestPasswordChangeResource
    requestpasswordchange_post = key(cast=str, required=False, default=None)

    # RefreshTokenResource
    refreshtoken_post = key(cast=str, required=False, default=None)

    # ValidateTokenResource
    validatetoken_get = key(cast=str, required=False, default=None)

    # AuthGroupListResource
    authgrouplist_get = key(cast=str, required=False, default=None)

    # TextBlobResource
    textblob_get = key(cast=str, required=False, default=None)
    textblob_post = key(cast=str, required=False, default=None)

    # TextBlobItemResource
    textblobitem_get = key(cast=str, required=False, default=None)
    textblobitem_put = key(cast=str, required=False, default=None)
    textblobitem_delete = key(cast=str, required=False, default=None)

    # CommentResource
    comment_get = key(cast=str, required=False, default=None)
    comment_post = key(cast=str, required=False, default=None)

    # CommentDeleteResource
    commentdelete_delete = key(cast=str, required=False, default=None)

    # ConfigStatsResource
    configstats_get = key(cast=str, required=False, default=None)

    # ConfigResource
    config_get = key(cast=str, required=False, default=None)
    config_post = key(cast=str, required=False, default=None)

    # ConfigItemResource
    configitem_get = key(cast=str, required=False, default=None)
    configitem_put = key(cast=str, required=False, default=None)
    configitem_delete = key(cast=str, required=False, default=None)

    # FileResource
    file_get = key(cast=str, required=False, default=None)
    file_post = key(cast=str, required=False, default=None)

    # FileItemResource
    fileitem_get = key(cast=str, required=False, default=None)
    fileitem_post = key(cast=str, required=False, default=None)
    fileitem_delete = key(cast=str, required=False, default=None)

    # FileDownloadResource
    filedownload_post = key(cast=str, required=False, default=None)

    # GroupListResource
    grouplist_get = key(cast=str, required=False, default=None)

    # GroupResource
    group_get = key(cast=str, required=False, default=None)
    group_post = key(cast=str, required=False, default=None)
    group_put = key(cast=str, required=False, default=None)
    group_delete = key(cast=str, required=False, default=None)

    # GroupMemberResource
    groupmember_post = key(cast=str, required=False, default=None)
    groupmember_put = key(cast=str, required=False, default=None)
    groupmember_delete = key(cast=str, required=False, default=None)

    # KartonObjectResource
    kartonobject_get = key(cast=str, required=False, default=None)
    kartonobject_post = key(cast=str, required=False, default=None)

    # KartonAnalysisResource
    kartonanalysis_get = key(cast=str, required=False, default=None)
    kartonanalysis_put = key(cast=str, required=False, default=None)

    # MetakeyResource
    metakey_get = key(cast=str, required=False, default=None)
    metakey_post = key(cast=str, required=False, default=None)
    metakey_delete = key(cast=str, required=False, default=None)

    # MetakeyListDefinitionResource
    metakeylistdefinition_get = key(cast=str, required=False, default=None)

    # MetakeyListDefinitionManageResource
    metakeylistdefinitionmanage_get = key(cast=str, required=False, default=None)

    # MetakeyDefinitionManageResource
    metakeydefinitionmanage_get = key(cast=str, required=False, default=None)
    metakeydefinitionmanage_post = key(cast=str, required=False, default=None)
    metakeydefinitionmanage_put = key(cast=str, required=False, default=None)
    metakeydefinitionmanage_delete = key(cast=str, required=False, default=None)

    # MetakeyPermissionResource
    metakeypermission_put = key(cast=str, required=False, default=None)
    metakeypermission_delete = key(cast=str, required=False, default=None)

    # OpenIDProviderResource
    openidprovider_post = key(cast=str, required=False, default=None)

    # OpenIDSingleProviderResource
    openidsingleprovider_get = key(cast=str, required=False, default=None)
    openidsingleprovider_put = key(cast=str, required=False, default=None)
    openidsingleprovider_delete = key(cast=str, required=False, default=None)

    # OpenIDBindAccountResource
    openidbindaccount_post = key(cast=str, required=False, default=None)
    # OpenIDAccountIdentitiesResource
    openidaccountidentities_get = key(cast=str, required=False, default=None)

    # ObjectResource
    object_get = key(cast=str, required=False, default=None)

    # ObjectItemResource
    objectItem_get = key(cast=str, required=False, default=None)
    objectItem_post = key(cast=str, required=False, default=None)
    objectItem_put = key(cast=str, required=False, default=None)
    objectItem_delete = key(cast=str, required=False, default=None)

    # ObjectCountResource
    objectcount_get = key(cast=str, required=False, default=None)

    # ObjectFavoriteResource
    objectfavorite_put = key(cast=str, required=False, default=None)
    objectfavorite_delete = key(cast=str, required=False, default=None)

    # QuickQueryResource
    quickquery_get = key(cast=str, required=False, default=None)
    quickquery_post = key(cast=str, required=False, default=None)

    # QuickQueryItemResource
    quickqueryitem_delete = key(cast=str, required=False, default=None)

    # RelationsResource
    relations_get = key(cast=str, required=False, default=None)

    # ObjectChildResource
    objectchild_put = key(cast=str, required=False, default=None)
    objectchild_delete = key(cast=str, required=False, default=None)

    # RemoteListResource
    remotelist_get = key(cast=str, required=False, default=None)

    # RemoteFilePullResource
    remotefilepull_post = key(cast=str, required=False, default=None)

    # RemoteConfigPullResource
    remoteconfigpull_post = key(cast=str, required=False, default=None)

    # RemoteTextBlobPullResource
    remotetextblobpull_post = key(cast=str, required=False, default=None)

    # RemoteFilePushResource
    remotefilepush_post = key(cast=str, required=False, default=None)

    # RemoteConfigPushResource
    remoteconfigpush_post = key(cast=str, required=False, default=None)

    # RemoteTextBlobPushResource
    remotetextblobpush_post = key(cast=str, required=False, default=None)

    # SearchResource
    search_post = key(cast=str, required=False, default=None)

    # ServerAdminInfoResource
    serveradmininfo_get = key(cast=str, required=False, default=None)

    # ServerDocsResource
    serverdocs_get = key(cast=str, required=False, default=None)

    # ShareGroupListResource
    sharegrouplist_get = key(cast=str, required=False, default=None)

    # ShareResource
    share_get = key(cast=str, required=False, default=None)
    share_put = key(cast=str, required=False, default=None)

    # TagListResource
    taglist_get = key(cast=str, required=False, default=None)

    # TagResource
    tag_get = key(cast=str, required=False, default=None)
    tag_put = key(cast=str, required=False, default=None)
    tag_delete = key(cast=str, required=False, default=None)

    # UserListResource
    userlist_get = key(cast=str, required=False, default=None)

    # UserPendingResource
    userpending_post = key(cast=str, required=False, default=None)
    userpending_delete = key(cast=str, required=False, default=None)

    # UserRequestPasswordChangeResource
    userrequestpasswordchange_post = key(cast=str, required=False, default=None)

    # UserGetPasswordChangeTokenResource
    usergetpasswordchangetoken_get = key(cast=str, required=False, default=None)

    # UserResource
    user_get = key(cast=str, required=False, default=None)
    user_post = key(cast=str, required=False, default=None)
    user_put = key(cast=str, required=False, default=None)
    user_delete = key(cast=str, required=False, default=None)

    # UserProfileResource
    userprofile_get = key(cast=str, required=False, default=None)


class AppConfig(Config):
    mwdb = group_key(MWDBConfig)
    karton = group_key(KartonConfig)
    mwdb_limiter = group_key(MwdbLimiterConfig)


def _config_sources():
    return [
        EnvironmentConfigSource(),
        IniFileConfigSource("mwdb.ini", must_exist=False),
        IniFileConfigSource(
            os.path.expanduser("~/.mwdb-core/mwdb.ini"), must_exist=False
        ),
        IniFileConfigSource("/etc/mwdb-core/mwdb.ini", must_exist=False),
    ]


app_config = AppConfig(sources=_config_sources())


def reload_config():
    app_config.provider.set_sources(_config_sources())
    app_config.provider.clear_cache()
