import os
import textwrap
from pathlib import Path

import click
import jinja2

from mwdb.cli.base import logger
from mwdb.core.config import reload_config
from mwdb.core.util import token_hex
from mwdb.paths import templates_dir


def generate_config(**options):
    config_tmpl = jinja2.Template((Path(templates_dir) / "mwdb.ini.tmpl").open().read())
    return config_tmpl.render(**options)


def create_configuration():
    local_user_dir = os.path.expanduser("~/.mwdb-core")
    message = textwrap.dedent(
        f"""
    Where do you want to place MWDB local files?

    1) Global directories (/var/lib/mwdb-core, /etc/mwdb-core)
    2) Local user directory ({local_user_dir})
    3) Current directory
    """
    )
    options = {
        "1": ("/var/lib/mwdb-core", "/etc/mwdb-core"),
        "2": (local_user_dir, local_user_dir),
        "3": (".", "."),
    }

    data_dir, config_dir = options[
        click.prompt(message, type=click.Choice(["1", "2", "3"]))
    ]
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(config_dir, exist_ok=True)

    default_postgres_uri = "postgresql://localhost/mwdb"
    postgres_uri = click.prompt(
        "PostgreSQL database connection string", default=default_postgres_uri
    )

    default_uploads__dir = os.path.join(data_dir, "uploads")
    uploads_dir = click.prompt(
        "Uploads storage path", default=default_uploads__dir, type=click.Path()
    )

    os.makedirs(uploads_dir, exist_ok=True)

    default_base_url = "http://127.0.0.1"
    base_url = click.prompt("Base public URL of MWDB service", default=default_base_url)

    web_dir = os.path.join(data_dir, "web")
    local_plugins_dir = os.path.join(data_dir, "plugins")
    mail_templates_dir = os.path.join(data_dir, "mail_templates")

    configuration = generate_config(
        postgres_uri=postgres_uri,
        uploads_folder=uploads_dir,
        base_url=base_url,
        web_folder=web_dir,
        local_plugins_folder=local_plugins_dir,
        mail_templates_folder=mail_templates_dir,
        secret_key=token_hex(16),
    )
    configuration_path = os.path.join(config_dir, "mwdb.ini")
    with open(configuration_path, "w") as f:
        f.write(configuration)

    logger.info("Configuration stored in %s file.", configuration_path)
    # Reload configuration including provided admin password
    reload_config()
