from flask import request, g
from flask_restful import Resource

from model import db, User, Object, Comment
from core.capabilities import Capabilities
from core.schema import CommentSchemaBase, CommentSchema

from . import authenticated_access, logger, requires_capabilities, requires_authorization


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
                      items:
                        $ref: '#/components/schemas/Comment'
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        db_object = authenticated_access(Object, identifier)
        comments = db.session.query(Comment.id, Comment.comment, Comment.timestamp, User.login.label("author")) \
            .filter(Comment.object_id == db_object.id, User.id == Comment.user_id)

        multi_comment = CommentSchema(many=True)
        dumped_comments = multi_comment.dump(comments)
        return dumped_comments

    @requires_authorization
    @requires_capabilities(Capabilities.adding_comments)
    def post(self, type, identifier):
        """
        ---
        summary: Create comment
        description: |
            Posts a new comment.

            Requires 'adding_comments' capability.
        security:
            - bearerAuth: []
        tags:
            - comment
        requestBody:
            description: Comment content
            content:
              application/json:
                schema: CommentSchemaBase
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
        responses:
            200:
                description: Posted comment object
                content:
                  application/json:
                    schema: CommentSchema
            400:
                description: When request body is invalid
            403:
                description: When user doesn't have 'adding_comments' capability.
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        schema = CommentSchemaBase()
        obj = schema.loads(request.get_data(as_text=True))

        if obj.errors:
            return {"errors": obj.errors}, 400

        db_object = authenticated_access(Object, identifier)

        db_comment = Comment()
        db_comment.comment = obj.data["comment"]
        db_comment.user_id = g.auth_user.id
        db_comment.object_id = db_object.id

        db.session.add(db_comment)
        db.session.commit()

        logger.info('comment added', extra={'comment': db_comment.object_id})

        db.session.refresh(db_comment)
        schema = CommentSchema()
        return schema.dump(db_comment)


class CommentDeleteResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.removing_comments)
    def delete(self, type, identifier, comment_id):
        """
        ---
        summary: Delete comment
        description: |
            Deletes a comment.

            Requires 'removing_comments' capability.
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
              description: Commented object's id
            - in: path
              name: comment_id
              schema:
                type: string
              description: Comment identifier
        responses:
            200:
                description: When comment was successfully deleted
            403:
                description: When user doesn't have 'removing_comments' capability.
            404:
                description: When object doesn't exist or user doesn't have access to this object.
        """
        db_object = authenticated_access(Object, identifier)

        for comment in db_object.comments:
            if comment.id == comment_id:
                db_object.comments.remove(comment)
                logger.info('comment deleted', extra={'comment': comment_id})
                break

        db.session.commit()
