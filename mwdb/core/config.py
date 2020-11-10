import os
from enum import Enum
from typing import List, Optional
from .typedconfig import Config, group_key, key, section
from .typedconfig.source import EnvironmentConfigSource, IniFileConfigSource

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
    BLOB = "BLOB"


def storage_provider_from_str(v) -> Optional[StorageProviderType]:
    if not v:
        return None
    
    v = v.upper()
    if v not in StorageProviderType._value2member_map_:
        raise ValueError(f"Blob Storage Provider {v} doesn't exist")
    return StorageProviderType[v]


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
    # Folder with web application files (if not set: served from pre-built package bundle)
    web_folder = key(cast=path, required=False, default=None)
    # Base application URL, accessible for users
    base_url = key(cast=str, required=False, default="http://127.0.0.1")
    # Flask additional settings file (optional)
    flask_config_file = key(cast=path, required=False)

    # Which storage provider to use (options: disk or blob)
    storage_provider = key(cast=storage_provider_from_str, required=False, default=StorageProviderType.DISK)
    # Folder for uploads
    uploads_folder = key(cast=path, required=False)
    # Should we break up the uploads into different folders for example: uploads/9/f/8/6/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
    hash_pathing = key(cast=intbool, required=False, default=True)
    # S3 compatible blob storage endpoint 
    blob_storage_endpoint = key(cast=str, required=False)
    # Blob Storage Access Key
    blob_storage_access_key = key(cast=str, required=False)
    # Blob Storage Secret Key
    blob_storage_secret_key = key(cast=str, required=False)
    # Blob Storage Region Name (If you're using S3 compatible storage set this to 'us-east-1')
    blob_storage_region_name = key(cast=str, required=False)
    # Blob Storage Bucket Name
    blob_storage_bucket_name = key(cast=str, required=False)

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

    enable_rate_limit = key(cast=intbool, required=False, default=False)
    enable_registration = key(cast=intbool, required=False, default=False)
    enable_maintenance = key(cast=intbool, required=False, default=False)
    enable_hooks = key(cast=intbool, required=False, default=True)

    mail_smtp = key(cast=str, required=False)
    mail_from = key(cast=str, required=False, default="noreply@mwdb")
    mail_templates_folder = key(cast=path, required=False, default=mail_templates_dir)
    mail_username = key(cast=str, required=False)
    mail_password = key(cast=str, required=False)
    mail_tls = key(cast=intbool, required=False, default=False)

    recaptcha_site_key = key(cast=str, required=False)
    recaptcha_secret = key(cast=str, required=False)

    enable_json_logger = key(cast=intbool, required=False, default=False)


class AppConfig(Config):
    mwdb = group_key(MWDBConfig)


def _config_sources():
    return [
        EnvironmentConfigSource(),
        IniFileConfigSource("mwdb.ini", must_exist=False),
        IniFileConfigSource(os.path.expanduser("~/.mwdb-core/mwdb.ini"), must_exist=False),
        IniFileConfigSource("/etc/mwdb-core/mwdb.ini", must_exist=False)
    ]


app_config = AppConfig(sources=_config_sources())


def reload_config():
    app_config.provider._config_sources = _config_sources()
    app_config.provider.clear_cache()
