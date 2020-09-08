import os

import click
import textwrap

from mwdb.core.config import app_config

from .base import create_app, AppDefaultGroup, CustomFlaskGroup
from .configuration import create_configuration
from .database import configure_database


@click.group(cls=CustomFlaskGroup, create_app=create_app, add_version_option=False)
def cli():
    """MWDB malware database"""


@cli.group(cls=AppDefaultGroup, default="basic", default_if_no_args=True)
@click.option("--quiet", "-q", is_flag=True, help="Unattended (quiet) configuration.")
@click.pass_context
def configure(ctx, quiet):
    """
    Configure MWDB instance
    """
    ctx.obj.data["quiet"] = quiet


@configure.command("basic", with_appcontext=False)
@click.pass_context
def configure_basic(ctx):
    """
    Basic MWDB instance configuration
    """
    try:
        app_config.read()
    except Exception as e:
        if ctx.obj.data["quiet"]:
            click.echo(
                "[!] Correct configuration must be provided via env vars in unattended mode!",
                err=True,
            )
            ctx.abort()
        create_configuration()
    else:
        click.echo("[+] Configuration already initialized... skipping")

    try:
        # Load application
        app = create_app()
        with app.app_context():
            configure_database()
    except Exception as e:
        import traceback
        traceback.print_exc()
        click.echo(
            textwrap.dedent(
                f"""
        Something went wrong during database configuration. 
        
        Check if '{app_config.mwdb.postgres_uri}' PostgreSQL connection string is correct
        and database is running.
                """
            )
        )
    else:
        click.echo(
            textwrap.dedent(
                """
        MWDB configured successfully!
        
        Use 'mwdb-core run' to run the server.
        """
            )
        )


@configure.command("web", with_appcontext=False)
@click.option(
    "--target-dir",
    type=click.Path(resolve_path=True),
    default=app_config.get_key("mwdb", "web_folder"),
    show_default=True,
    help="Build target directory to be overwritten.",
    required=True,
)
@click.pass_context
def configure_web(ctx, target_dir):
    """
    Rebuild MWDB web application files.

    By default MWDB serves pre-built web application bundle, but if
    you want to use web plugins: web need to be rebuilt from sources.

    Command requires Node.js and npm to be installed.
    """
    from mwdb.cli.web import npm_build_web

    if (
        os.path.exists(target_dir)
        and not ctx.obj.data["quiet"]
        and not click.confirm(f"Path {target_dir} exists and will be removed. Continue?")
    ):
        ctx.abort()

    npm_build_web(target_dir)

    if app_config.mwdb.web_folder != target_dir:
        click.echo(
            textwrap.dedent(
                f"""
        [!] Build target directory differs from directory set in configuration
            ({target_dir} != {app_config.mwdb.web_folder})
            Put the following line in mwdb.ini file to serve web app from new location:

            web_folder = {target_dir}
        """
            ),
            err=True,
        )
