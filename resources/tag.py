from flask import request, g
from flask_restful import Resource
from sqlalchemy.sql import and_

from model import db, Object, Tag, object_tag_table, ObjectPermission
from core.capabilities import Capabilities
from core.schema import TagSchema

from . import authenticated_access, logger, requires_capabilities, requires_authorization


class TagListResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        description: Get list of tags for autocompletion purposes
        security:
            - bearerAuth: []
        tags:
            - tag
        responses:
            200:
                description: Existing tags
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/Tag'
        """
        tag_prefix = request.args.get('query')

        if not tag_prefix or len(tag_prefix) == 0:
            tags = []
        else:
            tag_prefix = tag_prefix.lower()
            tags = db.session.query(Tag.tag)\
                             .distinct(Tag.tag)\
                             .join(object_tag_table, object_tag_table.c.tag_id == Tag.id) \
                             .join(ObjectPermission,
                                   and_(ObjectPermission.object_id == object_tag_table.c.object_id,
                                        g.auth_user.is_member(ObjectPermission.group_id))) \
                             .filter(Tag.tag.like(tag_prefix + "%")).all()
        multi_tag = TagSchema(many=True)
        dumped_tags = multi_tag.dump(tags)
        return dumped_tags


class TagResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        description: Get tags attached to an object
        security:
            - bearerAuth: []
        tags:
            - tag
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of target object
            - in: path
              name: identifier
              schema:
                type: string
              description: SHA256 object unique identifier
        responses:
            200:
                description: User object
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/Tag'
        """
        db_object = authenticated_access(Object, identifier)

        tags = db.session.query(Tag) \
            .filter(Tag.objects.any(id=db_object.id)).all()

        multi_tag = TagSchema(many=True)
        dumped_tags = multi_tag.dump(tags)
        return dumped_tags

    @requires_authorization
    @requires_capabilities(Capabilities.adding_tags)
    def put(self, type, identifier):
        """
        ---
        description: Attach new tag to an object
        security:
            - bearerAuth: []
        tags:
            - tag
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of target object
            - in: path
              name: identifier
              schema:
                type: string
              description: SHA256 object unique identifier
        responses:
            200:
                description: When tag is successfully added
        """
        schema = TagSchema()
        obj = schema.loads(request.get_data(as_text=True))

        if obj.errors:
            return {"errors": obj.errors}, 400

        db_object = authenticated_access(Object, identifier)
        tag_name = obj.data["tag"].lower().strip()

        was_modified = db_object.add_tag(tag_name)

        logger.info('tag added', extra={'tag_name': tag_name, 'dhash': db_object.dhash})
        return {"modified": was_modified}, 200

    @requires_authorization
    @requires_capabilities(Capabilities.removing_tags)
    def delete(self, type, identifier):
        """
        ---
        description: Remove tag from object
        security:
            - bearerAuth: []
        tags:
            - tag
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of target object
            - in: path
              name: identifier
              schema:
                type: string
              description: SHA256 object unique identifier
        responses:
            200:
                description: When tag is successfully removed
        """

        schema = TagSchema()
        obj = schema.load({"tag": request.args.get("tag")})

        if obj.errors:
            return {"errors": obj.errors}, 400

        db_object = authenticated_access(Object, identifier)
        tag_name = obj.data["tag"].lower().strip()

        was_modified = db_object.remove_tag(tag_name)

        logger.info('tag removed', extra={'tag_name': tag_name, 'dhash': db_object.dhash})
        return {"modified": was_modified}, 200
