import logging

from flask import g
import logmatic
from .config import app_config

logging_type = app_config.mwdb.logging_type


class ContextFilter(logging.Filter):
    def filter(self, record):
        record.auth_user = g.auth_user.login if g.get('auth_user') is not None else None
        record.request_id = g.request_id

        if logging_type == "standard":
            dummy = logging.LogRecord(None, None, None, None, None, None, None)
            extra_list = []

            for k, v in record.__dict__.items():
                if k == "arguments":
                    v = v.to_dict()
                if k not in dummy.__dict__:
                    extra_list.append('{}:{}'.format(k, v))

            extra_txt = ' - '.join(extra_list)
            record.extra = extra_txt

        return True


logger = logging.getLogger('mwdb.application')

# Don't propagate to root logger
logger.propagate = False

# Setup stream handler for main logger
handler = logging.StreamHandler()

if logging_type == "standard":
    formatter = logging.Formatter(fmt="File:%(filename)s - Function:%(funcName)s - Level:%(levelname)s - Line:"
                                      "%(lineno)s - Module:%(module)s - Thread:%(threadName)s" 
                                      " - Message:%(message)s - %(extra)s")
    handler.setFormatter(
        formatter
    )

elif logging_type == "json":
    formatter = logmatic.JsonFormatter(fmt="%(filename) %(funcName) %(levelname) %(lineno) %(module) %(threadName) %(message)")

    handler.setFormatter(
        formatter
    )

logger.addFilter(ContextFilter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)


def getLogger():
    return logger
