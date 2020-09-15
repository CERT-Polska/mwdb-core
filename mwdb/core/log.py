import logging

from flask import g
import logmatic
from .config import app_config


class ContextFilter(logging.Filter):
    def filter(self, record):
        record.auth_user = g.auth_user.login if g.get('auth_user') is not None else None
        record.request_id = g.request_id
        print("RECORD" + str(record.__dict__))
        return True


logger = logging.getLogger('mwdb.application')

# Don't propagate to root logger
logger.propagate = False

logging_type = app_config.mwdb.logging_type

# Setup stream handler for main logger
handler = logging.StreamHandler()

if logging_type == "standard":
    formatter = logging.Formatter(fmt="File:%(filename)s - Function:%(funcName)s - Level:%(levelname)s - Line:"
                                      "%(lineno)s - Module:%(module)s - Thread:%(threadName)s - Path:%(path)s - Arguments:%(args)s"
                                      " Method:%(method)s - Status:%(status)s - Response_time:%(response_time)s - "
                                      "Response_size:%(response_size)s - Auth_user:%(auth_user)s - Request_id:%(request_id)s"
                                      " - Message:%(message)s")
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
