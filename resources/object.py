from flask import request, g
from flask_restful import Resource
from luqum.parser import parser, ParseError
from werkzeug.exceptions import Forbidden, BadRequest, MethodNotAllowed, Conflict, NotFound

from model.object import AccessType
from plugin_engine import hooks
from model import db, Object, Group
from core.capabilities import Capabilities
from core.schema import ObjectShowBase, MetakeyShowSchema, MultiObjectSchema
from core.search import SQLQueryBuilder, SQLQueryBuilderBaseException

from . import logger, authenticated_access, requires_authorization


class ObjectListResource(Resource):
    ObjectType = Object
    Schema = MultiObjectSchema
    SchemaKey = "objects"

    @requires_authorization
    def get(self):
        """
        ---
        description: Retrieves list of objects
        security:
            - bearerAuth: []
        tags:
            - object
        parameters:
            - in: query
              name: page
              schema:
                type: integer
              description: Page number (deprecated)
              required: false
            - in: query
              name: older_than
              schema:
                type: string
              description: Fetch objects which are older than the object specified by SHA256 identifier
              required: false
            - in: query
              name: query
              schema:
                type: string
              description: Filter results using Lucene query
        responses:
            200:
                description: List of objects
                content:
                  application/json:
                    schema: MultiObjectSchema
            400:
                description: Syntax error in Lucene query
        """
        if 'page' in request.args and 'older_than' in request.args:
            raise BadRequest("page and older_than can't be used simultaneously. Use `older_than` for new code.")

        if 'page' in request.args:
            logger.warning("'%s' used legacy 'page' parameter", g.auth_user.login)

        page = max(1, int(request.args.get('page', 1)))
        query = request.args.get('query')

        pivot_obj = None
        older_than = request.args.get('older_than')
        if older_than:
            pivot_obj = authenticated_access(Object, older_than)

        predicate = g.auth_user.has_access_to_object(self.ObjectType.id)

        if query:
            """
            If query parameter is passed, query for objects using search baked queries
            """
            try:
                builder = SQLQueryBuilder(object_type=self.ObjectType,
                                          query_args=(self.ObjectType,))
                tree = parser.parse(query)
                if pivot_obj:
                    builder.baked_query += lambda q: q.filter(Object.id < pivot_obj.id)
                builder.baked_query += lambda q: q.filter(predicate)
                baked_query = builder(tree, order_by=Object.id.desc(), limit=10)
                if page > 1:
                    baked_query += lambda q: q.offset((page - 1) * 10)
                objs = baked_query(db.session()).all()
            except SQLQueryBuilderBaseException as e:
                raise BadRequest(str(e))
            except ParseError as e:
                raise BadRequest(str(e))
        else:
            """
            If not, use simple query
            """
            objs = db.session.query(self.ObjectType) \
                     .filter(predicate)
            objs = objs.order_by(Object.id.desc())
            if pivot_obj:
                objs = objs.filter(Object.id < pivot_obj.id)
            elif page > 1:
                objs = objs.offset((page - 1) * 10)
            objs = objs.limit(10).all()
        schema = self.Schema()
        return schema.dump({self.SchemaKey: objs})


class ObjectResource(Resource):
    ObjectType = Object
    ObjectTypeStr = Object.__tablename__
    Schema = ObjectShowBase
    on_created = None
    on_reuploaded = None

    @requires_authorization
    def get(self, identifier):
        """
        ---
        description: Fetch object information by hash
        security:
            - bearerAuth: []
        tags:
            - object
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: SHA256 object unique identifier
        responses:
            200:
                description: When object was found
                content:
                  application/json:
                    schema: ObjectShowBase
            404:
                description: When object was not found
        """
        schema = self.Schema()
        obj = authenticated_access(self.ObjectType, identifier.lower())
        return schema.dump(obj)

    def create_object(self, obj):
        raise NotImplementedError()

    @requires_authorization
    def post(self, identifier):
        if self.ObjectType is Object:
            raise MethodNotAllowed()

        schema = self.Schema()

        if request.is_json:
            obj = schema.loads(request.get_data(parse_form_data=True, as_text=True))
        elif 'json' in request.form:
            obj = schema.loads(request.form["json"])
        else:
            obj = None

        if obj and obj.errors:
            return {"errors": obj.errors}, 400

        if identifier == 'root':
            parent_object = None
        else:
            if not g.auth_user.has_rights(Capabilities.adding_parents):
                raise Forbidden("You are not permitted to link with parent")
            parent_object = authenticated_access(Object, identifier)

        metakeys = request.form.get('metakeys')
        upload_as = request.form.get("upload_as") or "*"

        if metakeys:
            metakeys = MetakeyShowSchema().loads(metakeys)
            if metakeys.errors:
                logger.warn('schema error', extra={
                    'error': metakeys.errors
                })
                raise BadRequest()
            metakeys = metakeys.data['metakeys']

        item, is_new = self.create_object(obj)

        if item is None:
            raise Conflict("Conflicting object types")

        if is_new:
            db.session.add(item)

        if metakeys:
            for metakey in metakeys:
                if item.add_metakey(metakey['key'], metakey['value'], commit=False) is None:
                    raise NotFound("Metakey '{}' not defined or insufficient "
                                   "permissions to set that one".format(metakey["key"]))

        if parent_object:
            item.add_parent(parent_object, commit=False)
            logger.info('relation added', extra={'parent': parent_object.dhash,
                                                 'child': item.dhash})

        if upload_as == "*":
            share_with = [group.id for group in g.auth_user.groups if group.name != "public"]
        else:
            if not g.auth_user.has_rights(Capabilities.sharing_objects) and \
               upload_as not in [group.name for group in g.auth_user.groups]:
                raise NotFound("Group {} doesn't exist".format(upload_as))
            group = Group.get_by_name(upload_as)
            if group is None:
                raise NotFound("Group {} doesn't exist".format(upload_as))
            share_with = [group.id, Group.get_by_name(g.auth_user.login).id]
            if group.pending_group is True:
                raise NotFound("Group {} is pending".format(upload_as))

        for share_group_id in share_with:
            item.give_access(share_group_id, AccessType.ADDED, item, g.auth_user, commit=False)

        if is_new:
            for all_access_group in Group.all_access_groups():
                item.give_access(all_access_group.id, AccessType.ADDED, item, g.auth_user, commit=False)

        db.session.commit()

        if is_new:
            hooks.on_created_object(item)
            if self.on_created:
                self.on_created(item)
        else:
            hooks.on_reuploaded_object(item)
            if self.on_reuploaded:
                self.on_reuploaded(item)

        logger.info('{} added'.format(self.ObjectTypeStr), extra={
            'dhash': item.dhash,
            'is_new': is_new
        })

        return schema.dump(item)

    @requires_authorization
    def put(self, identifier):
        # All should be PUT
        return self.post(identifier)


class ObjectChildResource(Resource):
    @requires_authorization
    def put(self, type, parent, child):
        """
        ---
        description: Adds new relation between objects
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
              description: type of target object
            - in: path
              name: parent
              description: Hash (e.g. sha256) of the parent sample
              required: true
              schema:
                type: string
            - in: path
              name: child
              description: Hash (e.g. sha256) of the child sample
              required: true
              schema:
                type: string
        responses:
            200:
                description: When relation was successfully added
        """
        if not g.auth_user.has_rights(Capabilities.adding_parents):
            raise Forbidden("You are not permitted to perform this action")
        parent_object = authenticated_access(Object, parent)
        child_object = authenticated_access(Object, child)

        child_object.add_parent(parent_object, commit=False)

        db.session.commit()
        logger.info('child added', extra={
            'parent': parent_object.dhash,
            'child': child_object.dhash
        })
