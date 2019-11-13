import uuid

from datetime import datetime
from flask import g
from flask_restful import Resource
from sqlalchemy.orm.exc import NoResultFound
from werkzeug.exceptions import Forbidden, NotFound

from core.capabilities import Capabilities

from model import db
from model.api_key import APIKey
from model.user import User

from core.schema import APIKeyTokenSchema

from . import requires_authorization


class APIKeyIssueResource(Resource):
    @requires_authorization
    def post(self, login):
        if not g.auth_user.has_rights(Capabilities.manage_users) and g.auth_user.login != login:
            raise Forbidden("You are not permitted to perform this action")

        try:
            api_key_owner = User.query.filter(User.login == login).one()
        except NoResultFound:
            raise Forbidden('User not found')

        api_key = APIKey()
        api_key.id = uuid.uuid4()
        api_key.user_id = api_key_owner.id
        api_key.issued_by = g.auth_user.id
        api_key.issued_on = datetime.now()

        db.session.add(api_key)
        db.session.commit()

        return APIKeyTokenSchema().dump({
            "id": str(api_key.id),
            "token": api_key.generate_token()
        })


class APIKeyResource(Resource):
    @requires_authorization
    def get(self, api_key_id):
        try:
            api_key = APIKey.query.filter(APIKey.id == uuid.UUID(api_key_id)).one()
        except NoResultFound:
            raise NotFound("API key doesn't exist")

        if not g.auth_user.has_rights(Capabilities.manage_users) and g.auth_user.id != api_key.user_id:
            raise NotFound("API key doesn't exist")

        return APIKeyTokenSchema().dump({
            "id": str(api_key.id),
            "token": api_key.generate_token()
        })

    @requires_authorization
    def delete(self, api_key_id):
        try:
            api_key = APIKey.query.filter(APIKey.id == uuid.UUID(api_key_id)).one()
        except NoResultFound:
            raise NotFound("API key doesn't exist")

        if not g.auth_user.has_rights(Capabilities.manage_users) and g.auth_user.id != api_key.user_id:
            raise NotFound("API key doesn't exist")

        db.session.delete(api_key)
        db.session.commit()
