from flask import g, request
from flask_restful import Resource
from sqlalchemy.sql import and_
from werkzeug.exceptions import NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.plugins import hooks
from mwdb.model import ObjectPermission, Tag, db, object_tag_table
from mwdb.schema.tag import (
    TagItemResponseSchema,
    TagListRequestSchema,
    TagRequestSchema,
)

from . import (
    access_object,
    load_schema,
    loads_schema,
    logger,
    requires_authorization,
    requires_capabilities,
)


class TagListResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: Get list of tags
        description: |
            Returns list of available tags starting with provided prefix.

            Used for autocompletion purposes.
        security:
            - bearerAuth: []
        tags:
            - tag
        parameters:
            - in: query
              name: query
              schema:
                type: string
              description: Tag prefix
              required: false
        responses:
            200:
                description: List of tags
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/TagItemResponse'
        """
        schema = TagListRequestSchema()
        obj = load_schema(request.args, schema)

        tags = (
            db.session.query(Tag.tag)
            .distinct(Tag.tag)
            .join(object_tag_table, object_tag_table.c.tag_id == Tag.id)
            .join(
                ObjectPermission,
                and_(
                    ObjectPermission.object_id == object_tag_table.c.object_id,
                    g.auth_user.is_member(ObjectPermission.group_id),
                ),
            )
        )

        tag_prefix = obj["query"]
        if tag_prefix:
            tags = tags.filter(Tag.tag.startswith(tag_prefix, autoescape=True))
        tags = tags.all()

        schema = TagItemResponseSchema(many=True)
        return schema.dump(tags)


class TagResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object tags
        description: |
            Returns tags attached to an object.
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
              description: Type of object
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
        responses:
            200:
                description: List of object tags
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/TagItemResponse'
            404:
                description: |
                    When object doesn't exist or user doesn't have
                    access to this object.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        schema = TagItemResponseSchema(many=True)
        return schema.dump(db_object.tags)

    @requires_authorization
    @requires_capabilities(Capabilities.adding_tags)
    def put(self, type, identifier):
        """
        ---
        summary: Add object tag
        description: |
            Add new tag to an object.

            Requires `adding_tags` capability.
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
              description: Object identifier
        requestBody:
            description: Tag value
            content:
              application/json:
                schema: TagRequestSchema
        responses:
            200:
                description: When tag is successfully added
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/TagItemResponse'
            400:
                description: When tag is invalid
            403:
                description: When user doesn't have `adding_tags` capability.
            404:
                description: |
                    When object doesn't exist or user doesn't have
                    access to this object.
        """
        schema = TagRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        tag_name = obj["tag"]
        is_new = db_object.add_tag(tag_name)

        logger.info("Tag added", extra={"tag": tag_name, "dhash": db_object.dhash})
        db.session.refresh(db_object)
        if is_new:
            hooks.on_created_tag(db_object, tag_name)
        else:
            hooks.on_reuploaded_tag(db_object, tag_name)

        schema = TagItemResponseSchema(many=True)
        return schema.dump(db_object.tags)

    @requires_authorization
    @requires_capabilities(Capabilities.removing_tags)
    def delete(self, type, identifier):
        """
        ---
        summary: Delete object tag
        description: |
            Removes tag from object.

            Requires `removing_tags` capability.
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
              description: Type of object
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
            - in: query
              name: tag
              schema:
                type: string
              description: Tag to be deleted
              required: true
        responses:
            200:
                description: When tag is successfully removed
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/TagItemResponse'
            400:
                description: When tag is invalid
            403:
                description: When user doesn't have `removing_tags` capability.
            404:
                description: |
                    When object doesn't exist or user doesn't have
                    access to this object.
        """

        schema = TagRequestSchema()
        obj = load_schema(request.args, schema)

        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        tag_name = obj["tag"]
        db_object.remove_tag(tag_name)

        logger.info("Tag removed", extra={"tag": tag_name, "dhash": db_object.dhash})
        db.session.refresh(db_object)
        schema = TagItemResponseSchema(many=True)
        return schema.dump(db_object.tags)
