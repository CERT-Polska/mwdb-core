import logging
import textwrap

import click
from click_default_group import DefaultGroup
from flask.cli import AppGroup, FlaskGroup, NoAppException, ScriptInfo, with_appcontext

from mwdb.core.config import app_config

logger = logging.getLogger("mwdb.configure")


def create_app():
    try:
        app_config.read()
    except Exception as e:
        click.echo(
            textwrap.dedent(
                """
        [!] Wrong MWDB configuration.

        Use 'mwdb-core configure' to setup your MWDB instance.
        """
            )
        )
        raise NoAppException(f"Application not configured: {str(e)}")
    # Lazy-load app here
    from mwdb import app

    return app.app


class AppDefaultGroup(DefaultGroup):
    """
    Reimplementation of Flask.cli.AppGroup to support DefaultGroup facilities
    """

    def command(self, *args, **kwargs):
        wrap_for_ctx = kwargs.pop("with_appcontext", True)

        def decorator(f):
            if wrap_for_ctx:
                f = with_appcontext(f)
            return DefaultGroup.command(self, *args, **kwargs)(f)

        return decorator

    def group(self, *args, **kwargs):
        kwargs.setdefault("cls", AppGroup)
        return super().group(*args, **kwargs)


class CustomFlaskGroup(FlaskGroup):
    """
    Default FlaskGroup prints traceback for all exceptions that happen
    during list_commands, even NoAppException.
    It looks ugly, so we decided to override this.
    """

    def list_commands(self, ctx):
        self._load_plugin_commands()

        # The commands available is the list of both the application (if
        # available) plus the builtin commands.
        rv = set(click.Group.list_commands(self, ctx))
        info = ctx.ensure_object(ScriptInfo)
        try:
            rv.update(info.load_app().cli.list_commands(ctx))
        except NoAppException:
            pass
        except Exception:
            import traceback

            traceback.print_exc()
        return sorted(rv)
