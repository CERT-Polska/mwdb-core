from flask import request, g
from flask_restful import Resource

from werkzeug.exceptions import NotFound

from model import db, Object, Comment
from core.capabilities import Capabilities

from schema.comment import CommentRequestSchema, CommentItemResponseSchema

from . import logger, requires_capabilities, requires_authorization


class CommentResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object comments
        description: Returns all comments attached to the object.
        security:
            - bearerAuth: []
        tags:
            - comment
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of commented object (ignored)
            - in: path
              name: identifier
              schema:
                type: string
              description: Object identifier
        responses:
            200:
                description: List of comment objects
                content:
                  application/json:
                    schema:
                      type: array
                      items: CommentItemResponseSchema
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        db_object = Object.access(identifier)
        if not db_object:
            raise NotFound("Object not found")

        schema = CommentItemResponseSchema(many=True)
        return schema.dump(db_object.comments)

    @requires_authorization
    @requires_capabilities(Capabilities.adding_comments)
    def post(self, type, identifier):
        """
        ---
        summary: Create a new comment
        description: |
            Posts a new comment.

            Requires `adding_comments` capability.
        security:
            - bearerAuth: []
        tags:
            - comment
        parameters:
            - in: path
              name: type
              schema:
                type: string
                enum: [file, config, blob, object]
              description: Type of commented object (ignored)
            - in: path
              name: identifier
              schema:
                type: string
              description: Commented object's id
        requestBody:
            description: Comment content
            content:
              application/json:
                schema: CommentRequestSchema
        responses:
            200:
                description: Posted comment object
                content:
                  application/json:
                    schema: CommentItemResponseSchema
            400:
                description: When request body is invalid
            403:
                description: When user doesn't have `adding_comments` capability.
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        schema = CommentRequestSchema()
        obj = schema.loads(request.get_data(as_text=True))

        if obj.errors:
            return {"errors": obj.errors}, 400

        db_object = Object.access(identifier)
        if db_object is None:
            raise NotFound("Object not found")

        comment = Comment(
            comment=obj.data["comment"],
            user_id=g.auth_user.id,
            object_id=db_object.id
        )
        db.session.add(comment)
        db.session.commit()

        logger.info('comment added', extra={'comment': comment.object_id})

        db.session.refresh(comment)
        schema = CommentItemResponseSchema()
        return schema.dump(comment)


class CommentDeleteResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.removing_comments)
    def delete(self, type, identifier, comment_id):
        """
        ---
        summary: Delete comment
        description: |
            Deletes a comment.

            Requires `removing_comments` capability.
        security:
            - bearerAuth: []
        tags:
            - comment
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
              description: Commented object identifier
            - in: path
              name: comment_id
              schema:
                type: string
              description: Comment identifier
        responses:
            200:
                description: When comment was successfully deleted
            403:
                description: When user doesn't have the `removing_comments` capability.
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        db_object = Object.access(identifier)
        if db_object is None:
            raise NotFound("Object not found")

        db_comment = db.session.query(Comment).filter(Comment.id == comment_id).first()

        if db_comment is not None:
            db.session.delete(db_comment)
            logger.info('comment deleted', extra={'comment': comment_id})
            db.session.commit()
