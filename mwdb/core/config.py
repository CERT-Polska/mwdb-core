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

    # Which storage provider to use (options: disk or s3)
    storage_provider = key(
        cast=storage_provider_from_str, required=False, default="disk"
    )
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


class AppConfig(Config):
    mwdb = group_key(MWDBConfig)
    karton = group_key(KartonConfig)


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
