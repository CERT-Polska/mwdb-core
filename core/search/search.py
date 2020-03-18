from flask import g

from luqum.parser import parser
from luqum.utils import LuceneTreeVisitorV2

from model import db, Object, Metakey, ObjectPermission, Group, User, MetakeyPermission
from model.object import AccessType
from sqlalchemy import and_, or_, not_
from sqlalchemy.ext import baked
from sqlalchemy.sql.expression import true

import functools
from ..capabilities import Capabilities
from .mappings import mapping, mapping_objects, json_mapping, json_mapping_objects, multi_mapping, \
                      multi_mapping_objects, meta_mapping, meta_mapping_objects, share_mapping, share_mapping_objects


class SQLQueryBuilderBaseException(Exception):
    """
        Base
    """


class UnsupportedGrammarException(SQLQueryBuilderBaseException):
    """
        Raised when SQLQueryBuilder does not support given lucene grammar
    """


class FieldNotQueryableException(SQLQueryBuilderBaseException):
    """
        Raised when field does not exists, so it can't be queried, eg. file.unexistent_field
    """


class MultipleObjectsQueryException(SQLQueryBuilderBaseException):
    """
        Raised when multiple objects are queried, eg. file.file_name:something AND static.cfg:something2
    """

class ObjectNotFoundException(SQLQueryBuilderBaseException):
    """
        Raised when object referenced in query condition can't be found
    """


class SQLQueryBuilder(LuceneTreeVisitorV2):
    def __init__(self, object_type=None, query_args=None):
        bakery = baked.bakery()
        self.baked_query = bakery(lambda session: session.query(*(query_args or [object_type or Object])))

        self.queried_class = object_type
        self.wildcard_map = {
            "*": "%",
            "?": "_"
        }

    def visit_and_operation(self, node, parents, context):
        child_nodes = [self.visit(child_node, parents=parents + [node], context=context) for child_node in
                       node.children]

        conditions = and_(*child_nodes)
        return conditions

    def visit_or_operation(self, node, parents, context):
        child_nodes = [self.visit(child_node, parents=parents + [node], context=context) for child_node in
                       node.children]

        conditions = or_(*child_nodes)
        return conditions

    def visit_search_field(self, node, parents, context):
        object, condition_handler = self._extract_object_column_handler(node.name)

        if self.queried_class is not None and object is not self.queried_class and object is not Object:
            raise MultipleObjectsQueryException("Tried to query: {} and {}".format(
                object.__tablename__,
                self.queried_class.__tablename__))

        if self.queried_class is None and object is not Object:
            self.queried_class = object
            self.baked_query += lambda q: q.join(self.queried_class, self.queried_class.id == Object.id)

        context["condition_handler"] = condition_handler

        condition = self.visit(node.expr, parents=parents + [node], context=context)

        return condition

    def visit_not(self, node, parents, context):
        # .a is NOT's child
        child_node = node.a

        condition = not_(self.visit(child_node, parents=parents, context=context))
        return condition

    def visit_prohibit(self, node, parents, context):
        child_node = node.children[0]

        condition = not_(self.visit(child_node, parents=parents, context=context))
        return condition

    def visit_word(self, node, parents, context):
        # Word("asd")
        condition_handler = context.get("condition_handler", None)
        if condition_handler is None:
            raise FieldNotQueryableException("You have to specify field, check help for more information.")

        condition = self._get_condition(condition_handler, node)

        return condition

    def visit_phrase(self, node, parents, context):
        # Phrase("asd")
        condition_handler = context.get("condition_handler", None)
        if condition_handler is None:
            raise FieldNotQueryableException("You have to specify field, check help for more information.")

        # Strip the " from start and end
        node.value = node.value[1:-1]
        condition = self._get_condition(condition_handler, node)

        return condition

    def _get_value(self, node):
        has_wildcard = node.has_wildcard()

        if has_wildcard:
            value = self._get_wildcard_value(node)
        else:
            value = node.value

        return value

    def _get_condition(self, handler, node, is_range=False):
        condition = handler(node, is_range)
        return condition

    def _get_wildcard_value(self, node):
        wildcards = list(node.iter_wildcards())
        value = list(node.value)

        for wildcard in wildcards:
            low, high = wildcard[0]
            char = wildcard[1]
            value[low:high] = self.wildcard_map[char]
        value = "".join(value)

        return value

    def visit_range(self, node, parents, context):
        # [0 TO 10000] {0 TO 10000}
        condition_handler = context.get("condition_handler", None)
        if condition_handler is None:
            raise FieldNotQueryableException("You have to specify field, check help for more information.")

        return self._get_condition(condition_handler, node, is_range=True)

    def visit_group(self, node, parents, context):
        condition = self.visit(node.expr, parents=parents, context=context)
        return condition

    def visit_field_group(self, node, parents, context):
        condition = self.visit(node.expr, parents=parents, context=context)
        return condition

    def _extract_object_column_handler(self, field_name):
        field = self._ensure_field_object_type(field_name.split("."))
        parser = self._get_field_parser(field)
        object_, handler = parser(field)
        return object_, handler

    def _ensure_field_object_type(self, field):
        if field[0] not in mapping_objects:
            for object_type_name, object_type in mapping_objects.items():
                if self.queried_class is object_type:
                    break
            else:
                object_type_name = "object"
            return [object_type_name] + field
        return field

    def _classify_query(self, field):
        if len(field) == 0:
            return "default"

        for type_of_query, mapping_ in [("json", json_mapping),
                                        ("multi", multi_mapping),
                                        ("meta", meta_mapping),
                                        ("share", share_mapping),
                                        ("default", mapping)]:
            tmp = mapping_
            for i in range(2):
                if len(field) <= i:
                    break

                tmp = tmp.get(field[i], None)
                if tmp is None:
                    break
            else:
                return type_of_query
        return "default"

    def _get_field_parser(self, field):
        type_of_query = self._classify_query(field)

        if type_of_query == "json":
            return self._json_extractor
        elif type_of_query == "multi":
            return self._multi_field_extractor
        elif type_of_query == "meta":
            return self._meta_field_extractor
        elif type_of_query == "share":
            return self._share_field_extractor
        elif 0 < len(field) <= 2 and type_of_query == "default":
            return self._default_extractor
        else:
            raise FieldNotQueryableException(
                "Not supported field, make sure your query is correct.")

    def _default_extractor(self, field: list):
        object_type_name = field[0]
        object_type_class = mapping_objects.get(object_type_name, None)

        column = mapping
        for f in field:
            column = column.get(f, None)
            if column is None:
                raise FieldNotQueryableException("No such field: {}".format(f))

        return object_type_class, functools.partial(self._default_extract_condition, column)

    def _multi_field_extractor(self, field: list):
        object_type_name = field[0]
        object_type_class = multi_mapping_objects.get(object_type_name, None)

        column = multi_mapping
        for f in field:
            column = column.get(f, None)
            if column is None:
                raise FieldNotQueryableException("No such field: {}".format(f))

        return object_type_class, functools.partial(self._multi_extract_condition, column)

    def _meta_field_extractor(self, field: list):
        object_type_name = field[0]
        object_type_class = meta_mapping_objects.get(object_type_name, None)

        column = meta_mapping
        for f in field[:2]:
            column = column.get(f, None)
            if column is None:
                raise FieldNotQueryableException("No such field: {}".format(f))

        return object_type_class, functools.partial(self._meta_extract_condition, field[2:], column)

    def _share_field_extractor(self, field: list):
        object_type_name = field[0]
        object_type_class = share_mapping_objects.get(object_type_name, None)

        column = share_mapping
        column_field = None
        for f in field[:2]:
            column_field = f
            column = column.get(f, None)
            if column is None:
                raise FieldNotQueryableException("No such field: {}".format(f))

        return object_type_class, functools.partial(self._share_extract_condition, column, column_field)

    def _json_extractor(self, field: list):
        object_type_name = field[0]
        object_type_class = json_mapping_objects.get(object_type_name, None)

        column = json_mapping
        for f in field[:2]:
            column = column.get(f, None)
            if column is None:
                raise FieldNotQueryableException("No such field: {}".format(f))

        return object_type_class, functools.partial(self._json_extract_condition, field[2:], column)

    def _share_extract_condition(self, column, column_field, node, is_range=False):
        value = self._get_value(node)
        if column_field == "shared":
            group_id = db.session.query(Group).filter(Group.name == value).first()
            if group_id is None:
                raise ObjectNotFoundException("No such group: {}".format(value))
            group_id = group_id.id
            if not g.auth_user.has_rights(Capabilities.manage_users) and \
                    group_id not in [group.id for group in g.auth_user.groups]:
                raise ObjectNotFoundException("No such group: {}".format(value))
            condition = column.any(ObjectPermission.group_id == group_id)
        elif column_field == "uploader":
            if not g.auth_user.has_rights(Capabilities.manage_users) and not g.auth_user.login == value:
                raise ObjectNotFoundException("Currently you can query only for your own uploads.")
            uploader_id = db.session.query(User).filter(User.login == value).first()
            if uploader_id is None:
                raise ObjectNotFoundException("No such user: {}".format(value))
            uploader_id = uploader_id.id
            condition = column.any(and_(
                ObjectPermission.related_user_id == uploader_id,
                ObjectPermission.reason_type == AccessType.ADDED,
                ObjectPermission.related_object_id == ObjectPermission.object_id))
        else:
            raise FieldNotQueryableException("No such field: {}".format(column_field))
        return condition

    def _meta_extract_condition(self, meta_key_path: list, column, node, is_range=False):
        key_column = Metakey.key
        value_column = Metakey.value

        # Checking permissions for a given key
        if not g.auth_user.has_rights(Capabilities.reading_all_attributes):
            metakeys = (db.session.query(MetakeyPermission.key)
                                  .filter(MetakeyPermission.key == meta_key_path[0])
                                  .filter(MetakeyPermission.can_read == true())
                                  .filter(g.auth_user.is_member(MetakeyPermission.group_id)))
            if metakeys.first() is None:
                raise ObjectNotFoundException("No such attribute: {}".format(meta_key_path[0]))

        value = self._get_value(node)
        if node.has_wildcard():
            value_condition = column.any(value_column.like(value))
        else:
            value_condition = column.any(value_column == value)

        condition = column.any(and_(key_column == meta_key_path[0], value_condition))

        return condition

    def _multi_extract_condition(self, column, node, is_range=False):
        value = self._get_value(node)

        table = column.property.table
        column_to_query = None
        for c in table.c:
            if c.info.get("searchable", False):
                column_to_query = c

        if column_to_query is None:
            raise FieldNotQueryableException("No searchable column in this model")

        if node.has_wildcard():
            condition = column.any(column_to_query.like(value))
        else:
            condition = column.any(column_to_query == value)

        return condition

    def _json_extract_condition(self, json_path: list, column, node, is_range=False):
        column_to_query = column[json_path].astext
        if is_range:
            condition = and_(column_to_query > node.low.value)
            condition = and_(condition, column_to_query < node.high.value)
            if node.include_low:
                condition = or_(condition, column_to_query == node.low.value)

            if node.include_high:
                condition = or_(condition, column_to_query == node.high.value)

            return condition

        value = self._get_value(node)

        if node.has_wildcard():
            condition = column_to_query.like(value)
        else:
            condition = column_to_query == value

        return condition

    def _default_extract_condition(self, column, node, is_range=False):
        if is_range:
            condition = and_(column > node.low.value)
            condition = and_(condition, column < node.high.value)
            if node.include_low:
                condition = or_(condition, column == node.low.value)

            if node.include_high:
                condition = or_(condition, column == node.high.value)

            return condition

        value = self._get_value(node)

        if node.has_wildcard():
            condition = column.like(value)
        else:
            condition = column == value

        return condition

    def visit_unknown_operation(self, node, parents, context):
        raise UnsupportedGrammarException("{} is not supported".format(str(node)))

    def __call__(self, tree, limit=None, requestor=None, order_by=None):
        if requestor is not None:
            self.baked_query += lambda q: q.filter(requestor.has_access_to_object(Object.id))
        condition = self.visit(tree, context={})
        self.baked_query += lambda q: q.filter(condition)
        if order_by is not None:
            self.baked_query += lambda q: q.order_by(order_by)
        else:
            self.baked_query += lambda q: q.order_by(Object.upload_time.desc())
        if limit is not None:
            self.baked_query += lambda q: q.limit(limit)
        return self.baked_query


def search(query, requestor, limit=10000):
    builder = SQLQueryBuilder()
    tree = parser.parse(query)
    baked_query = builder(tree, limit=limit, requestor=requestor)
    return baked_query
