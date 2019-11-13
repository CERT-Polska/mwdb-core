import logging
from flask import g


class ContextFilter(logging.Filter):
    def filter(self, record):
        record.auth_user = g.auth_user.login if g.get('auth_user') is not None else None
        record.request_id = g.request_id
        return True


def getLogger():
    return logging.getLogger('malwarecage.application')
