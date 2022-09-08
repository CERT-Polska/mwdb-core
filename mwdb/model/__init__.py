import logging
import time

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event
from sqlalchemy.engine import Engine

from mwdb.core.config import app_config

engine_options = {}
logger = logging.getLogger("mwdb.sql_profiler")

if app_config.mwdb.statement_timeout:
    st_timeout = app_config.mwdb.statement_timeout
    engine_options["connect_args"] = {"options": f"-c statement_timeout={st_timeout}"}


def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    # Got from https://github.com/sqlalchemy/sqlalchemy/wiki/Profiling
    conn.info.setdefault("query_start_time", []).append(time.time())
    logger.debug("Query started:\n%s %s", statement, parameters)


def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info["query_start_time"].pop(-1)
    if total > 5:
        logger.warning(
            "Slow query took %f seconds:\n%s %s", total, statement, parameters
        )
    else:
        logger.debug("Query finished, took %f seconds", total)


if app_config.mwdb.enable_sql_profiler:
    event.listen(Engine, "before_cursor_execute", before_cursor_execute)
    event.listen(Engine, "after_cursor_execute", after_cursor_execute)
    logger.setLevel(
        logging.WARNING if app_config.mwdb.log_only_slow_sql else logging.DEBUG
    )

db = SQLAlchemy(engine_options=engine_options)

# These imports must appear after "db" declaration

from .api_key import APIKey  # noqa: E402
from .attribute import Attribute, AttributeDefinition, AttributePermission  # noqa: E402
from .blob import TextBlob  # noqa: E402
from .comment import Comment  # noqa: E402
from .config import Config, StaticConfig  # noqa: E402
from .file import File  # noqa: E402
from .group import Group, Member  # noqa: E402
from .karton import KartonAnalysis, karton_object  # noqa: E402
from .oauth import OpenIDProvider, OpenIDUserIdentity  # noqa: E402
from .object import Object, ObjectPermission, relation  # noqa: E402
from .quick_query import QuickQuery  # noqa: E402
from .tag import Tag  # noqa: E402
from .user import User  # noqa: E402

__all__ = [
    "db",
    "APIKey",
    "TextBlob",
    "Comment",
    "Config",
    "StaticConfig",
    "File",
    "Group",
    "KartonAnalysis",
    "karton_object",
    "Member",
    "Attribute",
    "AttributeDefinition",
    "AttributePermission",
    "Object",
    "ObjectPermission",
    "OpenIDProvider",
    "OpenIDUserIdentity",
    "relation",
    "QuickQuery",
    "Tag",
    "User",
]
