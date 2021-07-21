from flask import g, redirect, request, url_for
from flask_restful import Resource
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from mwdb.core.app import app


class OpenIDLoginResource(Resource):
    """
    ---
    summary: Login using OpenID Connect
    description: |
        Redirect to open id profile
    tags:
        - auth
    responses:
        200:
            description: Returns information about specific user
    """

    def post(self):
        ...


class OpenIDAuthorizeResource(Resource):
    """
    ---
    summary: Authorize using OpenID Connect
    description: |
        Authorize by open id connect token
    tags:
        - auth
    responses:
        200:
            description: Returns user information from open id connect provider
    """

    def post(self):
        ...
