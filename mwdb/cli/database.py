import click
from flask_migrate import upgrade

from mwdb.cli.base import logger
from mwdb.core.capabilities import Capabilities
from mwdb.core.config import app_config
from mwdb.model import Group, User, db


def _is_database_initialized():
    return Group.query.count() > 0 and User.query.count() > 0


def _initialize(admin_password):
    """
    Creates initial objects in database
    """
    public_group = Group(
        name=Group.PUBLIC_GROUP_NAME, capabilities=[], workspace=False, default=True
    )
    db.session.add(public_group)

    everything_group = Group(
        name=Group.DEFAULT_EVERYTHING_GROUP_NAME,
        capabilities=[Capabilities.access_all_objects],
        workspace=False,
    )
    db.session.add(everything_group)

    registered_group = Group(
        name=Group.DEFAULT_REGISTERED_GROUP_NAME,
        capabilities=[
            Capabilities.adding_files,
            Capabilities.manage_profile,
            Capabilities.personalize,
        ],
        workspace=False,
        default=True,
    )
    db.session.add(registered_group)

    admin_group = Group(
        name=app_config.mwdb.admin_login, capabilities=Capabilities.all(), private=True
    )
    db.session.add(admin_group)

    admin_user = User(
        login=app_config.mwdb.admin_login,
        email="admin@mwdb.local",
        additional_info="MWDB built-in administrator account",
        groups=[admin_group, everything_group, public_group, registered_group],
    )
    admin_user.reset_sessions()
    admin_user.set_password(admin_password)
    db.session.add(admin_user)
    db.session.commit()


def configure_database():
    upgrade()

    if _is_database_initialized():
        logger.info("Database already initialized... skipping")
        return

    if app_config.mwdb.admin_password:
        admin_password = app_config.mwdb.admin_password
    else:
        while True:
            admin_password = click.prompt(
                "Provide password for MWDB 'admin' account", hide_input=True
            )
            admin_repeat_password = click.prompt("Repeat password", hide_input=True)
            if admin_password == admin_repeat_password:
                break
            click.echo("[!] Passwords doesn't match", err=True)

    _initialize(admin_password)
