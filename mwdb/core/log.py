import logging

from flask import g
import logmatic
from .config import app_config


class ContextFilterJSON(logging.Filter):
    def filter(self, record):
        record.auth_user = g.auth_user.login if g.get('auth_user') is not None else None
        record.request_id = g.request_id

        return True

class ContextFilterStandard(logging.Filter):
    def filter(self, record):
        record.auth_user = g.auth_user.login if g.get('auth_user') is not None else None
        record.request_id = g.request_id

        dummy = logging.LogRecord(None, None, None, None, None, None, None)
        extra_txt = ''
        for k, v in record.__dict__.items():
            if k not in dummy.__dict__:
                extra_txt += '{}:{} - '.format(k, v)

        record.extra = extra_txt

        return True


logger = logging.getLogger('mwdb.application')

# Don't propagate to root logger
logger.propagate = False

logging_type = app_config.mwdb.logging_type

# Setup stream handler for main logger
handler = logging.StreamHandler()

if logging_type == "standard":
    formatter = logging.Formatter(fmt="File:%(filename)s - Function:%(funcName)s - Level:%(levelname)s - Line:"
                                      "%(lineno)s - Module:%(module)s - Thread:%(threadName)s" 
                                      " - Message:%(message)s - %(extra)s")
    handler.setFormatter(
        formatter
    )

    logger.addFilter(ContextFilterStandard())

elif logging_type == "json":
    formatter = logmatic.JsonFormatter(fmt="%(filename) %(funcName) %(levelname) %(lineno) %(module) %(threadName) %(message)")

    handler.setFormatter(
        formatter
    )
    logger.addFilter(ContextFilterJSON())

logger.addHandler(handler)
logger.setLevel(logging.INFO)


def getLogger():
    return logger
