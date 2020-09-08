import logging

from flask import g
import logmatic


class ContextFilter(logging.Filter):
    def filter(self, record):
        record.auth_user = g.auth_user.login if g.get('auth_user') is not None else None
        record.request_id = g.request_id
        return True


logger = logging.getLogger('mwdb.application')

# Don't propagate to root logger
logger.propagate = False

# Setup JSON stream handler for main logger
handler = logging.StreamHandler()
handler.setFormatter(
    logmatic.JsonFormatter(fmt="%(filename) %(funcName) %(levelname) %(lineno) %(module) %(threadName) %(message)"))
logger.addHandler(handler)
logger.addFilter(ContextFilter())
logger.setLevel(logging.INFO)


def getLogger():
    return logger
