import logging

import logmatic
from flask import g

from .config import app_config


class ContextFilter(logging.Filter):
    def filter(self, record):
        record.auth_user = g.auth_user.login if g.get("auth_user") is not None else None
        if g.get("request_id"):
            record.request_id = g.request_id
        return True


class InlineFormatter(logging.Formatter):
    def format(self, record):
        extra_list = []

        for k, v in record.__dict__.items():
            if k == "arguments":
                v = v.to_dict()
            if k not in logging.makeLogRecord({"message": ""}).__dict__:
                extra_list.append("{}:{}".format(k, v))

        return " - ".join([super().format(record), *extra_list])


def setup_logger():
    enable_json_logger = app_config.mwdb.enable_json_logger

    logger = logging.getLogger("mwdb")

    if logger.hasHandlers():
        # If already configured: return
        # Used by 'mwdb configure'
        return

    # Don't propagate to root logger
    logger.propagate = False

    # Setup stream handler for main logger
    handler = logging.StreamHandler()

    if enable_json_logger:
        formatter = logmatic.JsonFormatter(
            fmt="%(filename) %(funcName) %(levelname) "
            "%(lineno) %(module) %(threadName) %(message)"
        )
    else:
        formatter = InlineFormatter(
            fmt="[%(levelname)s] %(threadName)s "
            "- %(module)s.%(funcName)s:%(lineno)s"
            " - %(message)s"
        )
    handler.setFormatter(formatter)
    logger.addFilter(ContextFilter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def getLogger():
    return logging.getLogger("mwdb.application")
