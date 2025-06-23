import logging
import logging.config

from flask import g
from pythonjsonlogger import jsonlogger

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
        formatter = jsonlogger.JsonFormatter(
            fmt="%(funcName) %(levelname) %(message)",
            timestamp=True,
        )
    else:
        formatter = InlineFormatter(fmt="[%(levelname)s] - %(funcName)s - %(message)s")
    handler.setFormatter(formatter)
    handler.addFilter(ContextFilter())
    logger.addHandler(handler)

    if app_config.mwdb.log_level is not None:
        log_level_mapping = logging.getLevelNamesMapping()
        log_level = log_level_mapping[app_config.mwdb.log_level.upper()]
        logger.setLevel(log_level)
    else:
        logger.setLevel(
            logging.DEBUG if app_config.mwdb.enable_debug_log else logging.INFO
        )

    if app_config.mwdb.log_config_file is not None:
        logging.config.fileConfig(
            app_config.mwdb.log_config_file,
            disable_existing_loggers=False,
        )


def getLogger():
    return logging.getLogger("mwdb.application")
