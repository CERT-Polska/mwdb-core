"""
Based apispec-flask-restful supporting apispec>=1.0
psrok1 @ 2019

Original apispec-flask restful-plugin:
    Copyright (c) 2017 theirix
    https://github.com/theirix/apispec-flask-restful
"""

import logging
import re

from apispec import BasePlugin, yaml_utils
from apispec.exceptions import APISpecError


class ApispecFlaskRestful(BasePlugin):
    def init_spec(self, spec):
        super(ApispecFlaskRestful, self).init_spec(spec)

    def path_helper(self, path=None, operations=None, **kwargs):
        try:
            resource = kwargs.pop("resource")
            path = deduce_path(resource, **kwargs)
            # normalize path
            path = re.sub(r"<(?:[^:<>]+:)?([^<>]+)>", r"{\1}", path)
            return path
        except Exception as exc:
            logging.getLogger(__name__).exception("Exception parsing APISpec %s", exc)
            raise

    def operation_helper(self, path=None, operations=None, **kwargs):
        try:
            resource = kwargs.pop("resource")
            operations = parse_operations(resource, operations)
            return operations
        except Exception as exc:
            logging.getLogger(__name__).exception("Exception parsing APISpec %s", exc)
            raise


def deduce_path(resource, **kwargs):
    """Find resource path using provided API or path itself"""
    api = kwargs.get("api", None)
    if not api:
        # flask-restful resource url passed
        return kwargs.get("path").path

    # flask-restful API passed
    # Require MethodView
    if not getattr(resource, "endpoint", None):
        raise APISpecError("Flask-RESTful resource needed")

    if api.blueprint:
        # it is required to have Flask app to be able enumerate routes
        app = kwargs.get("app")
        if app:
            for rule in app.url_map.iter_rules():
                if rule.endpoint.endswith("." + resource.endpoint):
                    break
            else:
                raise APISpecError(
                    "Cannot find blueprint resource {}".format(resource.endpoint)
                )
        else:
            # Application not initialized yet, fallback to path
            return kwargs.get("path").path

    else:
        for rule in api.app.url_map.iter_rules():
            if rule.endpoint == resource.endpoint:
                rule.endpoint.endswith("." + resource.endpoint)
                break
        else:
            raise APISpecError("Cannot find resource {}".format(resource.endpoint))

    return rule.rule


def parse_operations(resource, operations):
    """Parse operations for each method in a flask-restful resource"""
    for method in resource.methods:
        docstring = getattr(resource, method.lower()).__doc__
        if docstring:
            operation = yaml_utils.load_yaml_from_docstring(docstring)
            if not operation:
                logging.getLogger(__name__).warning(
                    "Cannot load docstring for {}/{}".format(resource, method)
                )
            operations[method.lower()] = operation or dict()
    return operations
