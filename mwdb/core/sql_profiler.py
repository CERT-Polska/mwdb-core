import inspect
import logging
import time

from sqlalchemy import event
from sqlalchemy.engine import Engine

from mwdb.core.config import app_config

logger = logging.getLogger("mwdb.sql_profiler")


def find_application_frame():
    for frame in inspect.stack():
        filename = frame.filename

        if (
            "site-packages/sqlalchemy" not in filename
            and "/.venv/" not in filename
            and not filename.endswith("sql_profiler.py")
        ):
            return {
                "file": filename,
                "line": frame.lineno,
                "function": frame.function,
            }

    return {}


def get_request_context():
    from flask import request, g, has_request_context

    if has_request_context():
        request_id = g.request_id if hasattr(g, "request_id") else None
        return {
            "path": request.path,
            "method": request.method,
            "request_id": request_id,
        }
    return {}


def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    # Got from https://github.com/sqlalchemy/sqlalchemy/wiki/Profiling
    conn.info.setdefault("query_start_time", []).append(time.time())
    caller = find_application_frame()
    request_ctx = get_request_context()
    extra = {
        "sql": statement,
        "parameters": parameters,
        **request_ctx,
        **caller,
    }
    logger.debug("Query started", extra=extra)


def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    from flask import has_request_context, g

    if has_request_context():
        g.sql_queries_count = (
            g.sql_queries_count + 1 if hasattr(g, "sql_queries_count") else 1
        )
    total = time.time() - conn.info["query_start_time"].pop(-1)
    caller = find_application_frame()
    request_ctx = get_request_context()
    extra = {
        "sql": statement,
        "parameters": parameters,
        **request_ctx,
        **caller,
    }
    if total > 5:
        logger.warning("Slow query took %f seconds", total, extra=extra)
    else:
        logger.debug(
            "Query finished, took %f seconds",
            total,
            extra=extra,
        )


def attach_sql_profiler():
    event.listen(Engine, "before_cursor_execute", before_cursor_execute)
    event.listen(Engine, "after_cursor_execute", after_cursor_execute)
    logger.setLevel(
        logging.WARNING if app_config.mwdb.log_only_slow_sql else logging.DEBUG
    )
