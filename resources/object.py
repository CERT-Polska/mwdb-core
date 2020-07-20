from flask import request, g
from flask_restful import Resource
from luqum.parser import ParseError
from werkzeug.exceptions import Forbidden, BadRequest, NotFound

from model import db, Object, Group, MetakeyDefinition
from core.capabilities import Capabilities
from core.search import SQLQueryBuilder, SQLQueryBuilderBaseException

from schema.object import (
    ObjectListRequestSchema, ObjectListResponseSchema,
    ObjectItemResponseSchema
)

from . import logger, requires_authorization, requires_capabilities


def list_objects(object_type, response_schema, response_key):
    """
    Returns object listing for provided object type, schema and key based on
    request arguments

    :param object_type: Type of object
    :type object_type: Type[Object]
    :param response_schema: Schema used by object list response
    :type response_schema: Type[...ListResponseSchema]
    :param response_key: Schema key with list of items
    :type response_key: str
    :return: Response with list of objects
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
            raise NotFound("Object specified in 'older_than' parameter doesn't exist")

    if obj.data["query"]:
        try:
            db_query = SQLQueryBuilder().build_query(obj.data["query"], queried_type=object_type)
        except SQLQueryBuilderBaseException as e:
            raise BadRequest(str(e))
        except ParseError as e:
            raise BadRequest(str(e))
    else:
        db_query = db.session.query(object_type)

    db_query = (
        db_query.filter(g.auth_user.has_access_to_object(Object.id))
                .order_by(Object.id.desc())
    )
    if pivot_obj:
        db_query = db_query.filter(Object.id < pivot_obj.id)
    # Legacy parameter - to be removed
    elif obj.data["page"] is not None and obj.data["page"] > 1:
        db_query = db_query.offset((obj.data["page"] - 1) * 10)

    db_query = db_query.limit(10)
    objects = db_query.all()

    schema = response_schema()
    return schema.dump({response_key: objects})


def get_object(object_type, object_identifier, response_schema):
    """
    Returns object for provided object type, identifier and schema based on
    request arguments

    :param object_type: Type of object
    :type object_type: Type[Object]
    :param object_identifier: Object identifier
    :type object_identifier: str
    :param response_schema: Response schema
    :type response_schema: Type[ObjectItemResponseSchema]
    :return: Response with information about object
    """
    obj = object_type.access(object_identifier.lower())
    if obj is None:
        raise NotFound("Object not found")
    schema = response_schema()
    return schema.dump(obj)


def get_object_creation_params(params):
    """
    Validates and performs permission check of provided object creation params

    :param params: ObjectCreateRequestSchemaBase.data object
    :type params: dict
    :return: Tuple (parent_object, share_groups, metakeys)
    :rtype: Tuple[Object, List[Group], List[{"key": ..., "value": ...}]]
    """
    if params["parent"] is not None:
        if not g.auth_user.has_rights(Capabilities.adding_parents):
            raise Forbidden("You are not permitted to link with parent")

        parent_object = Object.access(params["parent"])

        if parent_object is None:
            raise NotFound("Parent object not found")
    else:
        parent_object = None

    upload_as = params["upload_as"]

    if upload_as == "*":
        share_with = [group for group in g.auth_user.groups if group.name != "public"]
    else:
        share_group = Group.get_by_name(upload_as)
        if share_group is None:
            raise NotFound(f"Group {upload_as} doesn't exist")
        elif share_group not in g.auth_user.groups and not g.auth_user.has_rights(Capabilities.sharing_objects):
            raise NotFound(f"Group {upload_as} doesn't exist")
        if share_group.pending_group is True:
            raise NotFound(f"Group {upload_as} is pending")
        share_with = [share_group, Group.get_by_name(g.auth_user.login)]

    metakeys = params["metakeys"]
    for metakey in params["metakeys"]:
        key = metakey["key"]
        if not MetakeyDefinition.query_for_set(key).first():
            raise NotFound(f"Metakey '{key}' not defined or insufficient "
                           "permissions to set that one")
    return parent_object, share_with, metakeys


class ObjectsResource(Resource):
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
                description: When wrong parameters were provided or syntax error occured in Lucene query
            404:
                description: When user doesn't have access to the `older_than` object
        """
        return list_objects(
            object_type=Object,
            response_schema=ObjectListResponseSchema,
            response_key="objects"
        )


class ObjectResource(Resource):
    @requires_authorization
    def get(self, identifier):
        """
        ---
        summary: Get object
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
        return get_object(
            object_type=Object,
            object_identifier=identifier,
            response_schema=ObjectItemResponseSchema
        )


class ObjectChildResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.adding_parents)
    def put(self, type, parent, child):
        """
        ---
        summary: Link existing objects
        description: |
            Add new relation between existing objects.

            Requires `adding_parents` capability.
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
              description: Type of object (ignored)
            - in: path
              name: parent
              description: Identifier of the parent object
              required: true
              schema:
                type: string
            - in: path
              name: child
              description: Identifier of the child object
              required: true
              schema:
                type: string
        responses:
            200:
                description: When relation was successfully added
            403:
                description: When user doesn't have `adding_parents` capability.
            404:
                description: When one of objects doesn't exist or user doesn't have access to object.
        """
        parent_object = Object.access(parent)
        if parent_object is None:
            raise NotFound("Parent object not found")

        child_object = Object.access(child)
        if child_object is None:
            raise NotFound("Child object not found")

        child_object.add_parent(parent_object, commit=False)

        db.session.commit()
        logger.info('Objects linked', extra={
            'parent': parent_object.dhash,
            'child': child_object.dhash
        })
