import os
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


@section("mwdb")
class MWDBConfig(Config):
    # PostgreSQL database URI
    postgres_uri = key(cast=str, required=True)
    # Flask secret key
    secret_key = key(cast=str, required=True)
    # Folder for uploads
    uploads_folder = key(cast=path, required=True)
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

    recaptcha_site_key = key(cast=str, required=False)
    recaptcha_secret = key(cast=str, required=False)


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
