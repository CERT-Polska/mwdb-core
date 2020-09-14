import logging

from flask import g
import logmatic
from .config import app_config


class ContextFilter(logging.Filter):
    def filter(self, record):
        record.auth_user = g.auth_user.login if g.get('auth_user') is not None else None
        record.request_id = g.request_id
        return True


logger = logging.getLogger('mwdb.application')

# Don't propagate to root logger
logger.propagate = False

logging_type = app_config.mwdb.logging_type

# Setup stream handler for main logger
handler = logging.StreamHandler()

if logging_type == "standard":
    formatter = logging.Formatter("%(filename)s %(funcName)s %(levelname)s %(lineno)s %(module)s %(threadName)s %(message)s")
elif logging_type == "json":
    formatter = logmatic.JsonFormatter(fmt="%(filename) %(funcName) %(levelname) %(lineno) %(module) %(threadName) %(message)")

handler.setFormatter(
    formatter
)
logger.addHandler(handler)
logger.addFilter(ContextFilter())
logger.setLevel(logging.INFO)


def getLogger():
    return logger
