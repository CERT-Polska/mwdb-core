from .typedconfig import Config, group_key, key, section
from .typedconfig.source import EnvironmentConfigSource, IniFileConfigSource


def intbool(v) -> bool:
    return bool(int(v))


@section("malwarecage")
class MalwarecageConfig(Config):
    # PostgreSQL database URI
    postgres_uri = key(cast=str, required=True)
    # Redis database URI
    redis_uri = key(cast=str, required=True)
    # Flask secret key
    secret_key = key(cast=str, required=True)
    # Folder for uploads
    uploads_folder = key(cast=str, required=False, default="./uploads")
    # Base application URL, accessible for users
    base_url = key(cast=str, required=False, default="http://127.0.0.1")
    # Flask additional settings file (optional)
    flask_config_file = key(cast=str, required=False)
    # Administrator account login
    admin_login = key(cast=str, required=False, default="admin")

    enable_rate_limit = key(cast=intbool, required=False, default=False)
    enable_registration = key(cast=intbool, required=False, default=False)
    enable_maintenance = key(cast=intbool, required=False, default=False)
    enable_plugins = key(cast=intbool, required=False, default=True)
    enable_hooks = key(cast=intbool, required=False, default=True)

    mail_smtp = key(cast=str, required=False)
    mail_from = key(cast=str, required=False, default="noreply@malwarecage")

    recaptcha_site_key = key(cast=str, required=False)
    recaptcha_secret = key(cast=str, required=False)


class AppConfig(Config):
    malwarecage = group_key(MalwarecageConfig)


app_config = AppConfig(sources=[
    EnvironmentConfigSource(),
    IniFileConfigSource("malwarecage.ini", must_exist=False)
])
