import json

from flask import request, g
from flask_restful import Resource
from luqum.parser import ParseError
from werkzeug.exceptions import Forbidden, BadRequest, MethodNotAllowed, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.plugins import hooks
from mwdb.core.search import SQLQueryBuilder, SQLQueryBuilderBaseException
from mwdb.model import db, Object, Group, MetakeyDefinition
from mwdb.schema.object import (
    ObjectListRequestSchema, ObjectListResponseSchema,
    ObjectItemResponseSchema,
    ObjectCountRequestSchema, ObjectCountResponseSchema
)

from . import logger, requires_authorization, requires_capabilities, get_type_from_str


class ObjectUploader:
    """
    Mixin adding common object upload capabilities to resource

    Merge it with ObjectsResource during retirement of ObjectResource deprecated upload methods
    """
    ObjectType = None
    ItemResponseSchema = None

    on_created = None
    on_reuploaded = None

    def _create_object(self, spec, parent, share_with, metakeys):
        raise NotImplementedError

    def create_object(self, params):
        params = dict(params)

        # Validate parent object
        if params["parent"] is not None:
            if not g.auth_user.has_rights(Capabilities.adding_parents):
                raise Forbidden("You are not permitted to link with parent")

            parent_object = Object.access(params["parent"])

            if parent_object is None:
                raise NotFound("Parent object not found")
        else:
            parent_object = None

        # Validate metakeys
        metakeys = params["metakeys"]
        for metakey in params["metakeys"]:
            key = metakey["key"]
            if not MetakeyDefinition.query_for_set(key).first():
                raise NotFound(f"Metakey '{key}' not defined or insufficient "
                               "permissions to set that one")

        # Validate upload_as argument
        upload_as = params["upload_as"]
        if upload_as == "*":
            # If '*' is provided: share with all user's groups except 'public'
            share_with = [group for group in g.auth_user.groups if group.name != "public"]
        else:
            share_group = Group.get_by_name(upload_as)
            # Does group exist?
            if share_group is None:
                raise NotFound(f"Group {upload_as} doesn't exist")
            # Has user access to group?
            if share_group not in g.auth_user.groups and not g.auth_user.has_rights(Capabilities.sharing_objects):
                raise NotFound(f"Group {upload_as} doesn't exist")
            # Is group pending?
            if share_group.pending_group is True:
                raise NotFound(f"Group {upload_as} is pending")
            share_with = [share_group, Group.get_by_name(g.auth_user.login)]

        item, is_new = self._create_object(params, parent_object, share_with, metakeys)

        db.session.commit()

        if is_new:
            hooks.on_created_object(item)
            self.on_created(item)
        else:
            hooks.on_reuploaded_object(item)
            self.on_reuploaded(item)

        logger.info(f'{self.ObjectType.__name__} added', extra={
            'dhash': item.dhash,
            'is_new': is_new
        })
        schema = self.ItemResponseSchema()
        return schema.dump(item)


class ObjectResource(Resource):
    ObjectType = Object
    ListResponseSchema = ObjectListResponseSchema

    @requires_authorization
    def get(self):
        """
        ---
        summary: Search or list objects
        description: |
            Returns list of objects matching provided query, ordered from the latest one.

            Limited to 10 objects, use `older_than` parameter to fetch more.

            Don't rely on maximum count of returned objects because it can be changed/parametrized in future.
        security:
            - bearerAuth: []
        tags:
            - object
        parameters:
            - in: query
              name: older_than
              schema:
                type: string
              description: Fetch objects which are older than the object specified by identifier. Used for pagination
              required: false
            - in: query
              name: query
              schema:
                type: string
              description: Filter results using Lucene query
              required: false
        responses:
            200:
                description: List of objects
                content:
                  application/json:
                    schema: ObjectListResponseSchema
            400:
                description: When wrong parameters were provided or syntax error occurred in Lucene query
            404:
                description: When user doesn't have access to the `older_than` object
        """
        if 'page' in request.args:
            logger.warning("'%s' used legacy 'page' parameter", g.auth_user.login)

        obj = ObjectListRequestSchema().load(request.args)
        if obj.errors:
            return {"errors": obj.errors}, 400

        pivot_obj = None
        if obj.data["older_than"]:
            pivot_obj = Object.access(obj.data["older_than"])
            if pivot_obj is None:
                raise NotFound("Object specified in 'older_than' parameter not found")

        query = obj.data["query"]
        if query:
            try:
                db_query = SQLQueryBuilder().build_query(query, queried_type=self.ObjectType)
            except SQLQueryBuilderBaseException as e:
                raise BadRequest(str(e))
            except ParseError as e:
                raise BadRequest(str(e))
        else:
            db_query = db.session.query(self.ObjectType)

        db_query = (
            db_query.filter(g.auth_user.has_access_to_object(Object.id))
                    .order_by(Object.id.desc())
        )
        if pivot_obj:
            db_query = db_query.filter(Object.id < pivot_obj.id)
        # Legacy parameter - to be removed in the future
        elif obj.data["page"] is not None and obj.data["page"] > 1:
            db_query = db_query.offset((obj.data["page"] - 1) * 10)

        objects = db_query.limit(10).all()

        schema = self.ListResponseSchema()
        return schema.dump(objects, many=True)


class ObjectItemResource(Resource, ObjectUploader):
    ObjectType = Object
    ItemResponseSchema = ObjectItemResponseSchema

    CreateRequestSchema = None
    on_created = None
    on_reuploaded = None

    @requires_authorization
    def get(self, identifier):
        """
        ---
        summary: Get object information
        description: |
            Returns information about object
        security:
            - bearerAuth: []
        tags:
            - object
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
        responses:
            200:
                description: Information about object
                content:
                  application/json:
                    schema: ObjectItemResponseSchema
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        obj = self.ObjectType.access(identifier)
        if obj is None:
            raise NotFound("Object not found")
        schema = self.ItemResponseSchema()
        return schema.dump(obj)

    def _get_upload_args(self, parent_identifier):
        """
        Transforms upload arguments mixed into various request fields
        """
        if request.is_json:
            # If request is application/json: all args are in JSON
            args = json.loads(request.get_data(parse_form_data=True, as_text=True))
        else:
            if 'json' in request.form:
                # If request is multipart/form-data: some args are in JSON and some are part of form
                args = json.loads(request.form["json"])
            else:
                args = {}
            if request.form.get('metakeys'):
                args["metakeys"] = request.form["metakeys"]
            if request.form.get('upload_as'):
                args["upload_as"] = request.form["upload_as"]
        args["parent"] = parent_identifier if parent_identifier != "root" else None
        return args

    @requires_authorization
    def post(self, identifier):
        if self.ObjectType is Object:
            raise MethodNotAllowed()

        schema = self.CreateRequestSchema()
        obj = schema.load(self._get_upload_args(identifier))
        if obj and obj.errors:
            return {"errors": obj.errors}, 400
        return self.create_object(obj.data)

    @requires_authorization
    def put(self, identifier):
        return self.post(identifier)

    @requires_authorization
    @requires_capabilities(Capabilities.removing_objects)
    def delete(self, identifier):
        """
        ---
        summary: Delete object
        description: |
            Removes an object from the database along with its references.

            Requires `removing_objects` capability.
        security:
            - bearerAuth: []
        tags:
            - object
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
        responses:
            200:
                description: When object was deleted
            403:
                description: When user doesn't have `removing_objects` capability
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        obj = self.ObjectType.access(identifier)

        if obj is None:
            raise NotFound("Object was not found")

        db.session.delete(obj)
        db.session.commit()


class ObjectCountResource(Resource):
    @requires_authorization
    def get(self, type):
        """
        ---
        summary: Count objects
        description: |
            Returns number of objects matching provided query.
        security:
            - bearerAuth: []
        tags:
            - object
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of objects
            - in: query
              name: query
              schema:
                type: string
              description: Filter objects using Lucene query
              required: false
        responses:
            200:
                description: Number of objects
                content:
                  application/json:
                    schema: ObjectCountResponseSchema
            400:
                description: When wrong parameters were provided or syntax error occurred in Lucene query
        """
        schema = ObjectCountRequestSchema()
        obj = schema.load(request.args)
        if obj.errors:
            return {"errors": obj.errors}, 400

        query = obj.data["query"]
        if query:
            try:
                db_query = SQLQueryBuilder().build_query(query, queried_type=get_type_from_str(type))
            except SQLQueryBuilderBaseException as e:
                raise BadRequest(str(e))
            except ParseError as e:
                raise BadRequest(str(e))
        else:
            db_query = db.session.query(get_type_from_str(type))

        db_query = db_query.filter(g.auth_user.has_access_to_object(Object.id))

        result = db_query.count()

        schema = ObjectCountResponseSchema()
        return schema.dump({"count": result})
