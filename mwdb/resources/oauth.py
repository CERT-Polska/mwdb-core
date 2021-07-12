from flask import g, redirect, request, url_for
from flask_restful import Resource
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from mwdb.core.app import app, oauth

oauth_server = oauth.register(
    name="oauth_server",
    client_id="client_id",
    client_secret="client_secret",
    access_token_url="http://127.0.0.1:5000/oauth/token",
    access_token_params=None,
    authorize_url="http://127.0.0.1:5000/oauth/authorize",
    authorize_params=None,
    api_base_url="http://127.0.0.1:5000/",
    userinfo_endpoint="http://127.0.0.1:5000/userinfo",
    client_kwargs={"scope": "openid profile"},
)


class OauthLoginResource(Resource):
    """
    ---
    summary: Login by redirect to get open id profile
    description: |
        Redirect to open id profile
    tags:
        - auth
    responses:
        200:
            description: Returns information about specific user
    """

    def get(self):
        client = oauth.create_client("oauth_server")
        redirect_uri = url_for("api.oauthauthorizeresource", _external=True)
        print("TU")
        return client.authorize_redirect(redirect_uri)


class OauthAuthorizeResource(Resource):
    """
    ---
    summary: Authorize by open id connect token
    description: |
        Authorize by open id connect token
    tags:
        - auth
    responses:
        200:
            description: Returns user information from open id connect provider
    """

    def get(self):
        print("TUTU")
        client = oauth.create_client("oauth_server")
        token = client.authorize_access_token()
        resp = client.get("userinfo").json()
        print(f"\n{resp}\n")
        return "You are successfully signed"
