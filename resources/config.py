from datetime import datetime, timedelta

from flask import request
from flask_restful import Resource
from sqlalchemy import func

from werkzeug.exceptions import BadRequest, Conflict

from plugin_engine import hooks

from model import Config, db
from model.object import ObjectTypeConflictError

from schema.config import (
    ConfigCreateRequestSchema,
    ConfigLegacyCreateRequestSchema,
    ConfigListResponseSchema,
    ConfigItemResponseSchema,
    ConfigStatsRequestSchema,
    ConfigStatsResponseSchema
)

from . import logger, requires_authorization, deprecated
from .object import (
    list_objects, get_object_creation_params, get_object,
    get_legacy_form_options,
    ObjectResource, ObjectsResource
)


class ConfigsResource(ObjectsResource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: Search or list configs
        description: |
            Returns list of configs matching provided query, ordered from the latest one.

            Limited to 10 objects, use `older_than` parameter to fetch more.

            Don't rely on maximum count of returned objects because it can be changed/parametrized in future.
        security:
            - bearerAuth: []
        tags:
            - config
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
                description: List of configs
                content:
                  application/json:
                    schema: ConfigListResponseSchema
            400:
                description: When wrong parameters were provided or syntax error occurred in Lucene query
            404:
                description: When user doesn't have access to the `older_than` object
        """
        return list_objects(
            object_type=Config,
            response_schema=ConfigListResponseSchema,
            response_key="configs"
        )

    @requires_authorization
    def post(self):
        """
        ---
        summary: Upload config
        description: Uploads new config.
        security:
            - bearerAuth: []
        tags:
            - config
        requestBody:
            required: true
            description: Configuration to be uploaded
            content:
              application/json:
                schema: ConfigCreateRequestSchema
                examples:
                  simple:
                    summary: Simple configuration upload
                    value:
                      cfg:
                        family: malwarex
                        urls: ["http://evil.local"]
                      family: malwarex
                  full:
                    summary: Fully-featured configuration upload
                    value:
                      cfg:
                        family: malwarex
                        urls: ["http://evil.local"]
                      family: malwarex
                      config_type: static
                      parent: null
                      upload_as: "*"
                      metakeys:
                       key: value
        responses:
            200:
                description: Information about uploaded config
                content:
                  application/json:
                    schema: ConfigItemResponseSchema
            403:
                description: No permissions to perform additional operations (e.g. adding parent, metakeys)
            404:
                description: |
                    One of attribute keys doesn't exist or user doesn't have permission to set it.

                    Specified `upload_as` group doesn't exist or user doesn't have permission to share objects
                    with that group
            409:
                description: Object exists yet but has different type
        """
        schema = ConfigCreateRequestSchema()
        params = schema.loads(request.get_data(as_text=True))

        if params and params.errors:
            return {"errors": params.errors}, 400

        parent, share_with, metakeys = get_object_creation_params(params.data)

        try:
            config, is_new = Config.get_or_create(
                params.data["cfg"],
                params.data["family"],
                params.data["config_type"],
                parent=parent,
                share_with=share_with,
                metakeys=metakeys
            )
            db.session.commit()
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a config")

        if is_new:
            hooks.on_created_object(config)
            hooks.on_created_config(config)
        else:
            hooks.on_reuploaded_object(config)
            hooks.on_reuploaded_config(config)

        logger.info(
            "Config added", extra={
                'dhash': config.dhash,
                'is_new': is_new
            }
        )
        schema = ConfigItemResponseSchema()
        return schema.dump(config)


class ConfigResource(ObjectResource):
    @requires_authorization
    def get(self, identifier):
        """
        ---
        summary: Get config
        description: |
            Returns config information and contents.
        security:
            - bearerAuth: []
        tags:
            - config
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: Config identifier
        responses:
            200:
                description: Config information and contents
                content:
                  application/json:
                    schema: ConfigItemResponseSchema
            404:
                description: |
                    When config doesn't exist, object is not a config or user doesn't have access to this object.
        """
        return get_object(
            object_type=Config,
            object_identifier=identifier,
            response_schema=ConfigItemResponseSchema
        )

    @deprecated
    @requires_authorization
    def put(self, identifier):
        """
        ---
        summary: Upload config (deprecated)
        description: Uploads new config.
        security:
            - bearerAuth: []
        tags:
            - deprecated
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              default: root
              description: |
                Parent object identifier or `root` if there is no parent.

                User must have `adding_parents` capability to specify a parent object.
        requestBody:
            required: true
            description: Configuration to be uploaded
            content:
              application/json:
                schema: ConfigLegacyCreateRequestSchema
        responses:
            200:
                description: Information about uploaded config
                content:
                  application/json:
                    schema: ConfigItemResponseSchema
            403:
                description: No permissions to perform additional operations (e.g. adding parent, metakeys)
            404:
                description: |
                    One of attribute keys doesn't exist or user doesn't have permission to set it.

                    Specified `upload_as` group doesn't exist or user doesn't have permission to share objects
                    with that group
            409:
                description: Object exists yet but has different type
        """
        schema = ConfigLegacyCreateRequestSchema()
        params = schema.load(get_legacy_form_options())

        if params and params.errors:
            return {"errors": params.errors}, 400

        params_data = dict(params.data)

        if params_data["metakeys"]:
            params_data["metakeys"] = params_data["metakeys"]["metakeys"]
        else:
            params_data["metakeys"] = []

        if identifier != "root":
            params_data["parent"] = identifier
        else:
            params_data["parent"] = None

        parent, share_with, metakeys = get_object_creation_params(params_data)

        try:
            config, is_new = Config.get_or_create(
                params.data["cfg"],
                params.data["family"],
                params.data["config_type"],
                parent=parent,
                share_with=share_with,
                metakeys=metakeys
            )
            db.session.commit()
        except ObjectTypeConflictError:
            raise Conflict("Object already exists and is not a config")

        if is_new:
            hooks.on_created_object(config)
            hooks.on_created_config(config)
        else:
            hooks.on_reuploaded_object(config)
            hooks.on_reuploaded_config(config)

        logger.info(
            "Config added", extra={
                'dhash': config.dhash,
                'is_new': is_new
            }
        )
        schema = ConfigItemResponseSchema()
        return schema.dump(config)


class ConfigStatsResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: Get config statistics
        description: Get static configuration global statistics grouped per malware family.
        security:
            - bearerAuth: []
        tags:
            - config
        parameters:
            - in: query
              name: range
              schema:
                type: string
              description: Time range in hours `24h`, days `2d` or all time `*`
              default: '*'
              required: false
        responses:
            200:
                description: Static configuration global statistics
                content:
                  application/json:
                    schema: ConfigStatsResponseSchema
        """
        schema = ConfigStatsRequestSchema()
        params = schema.load(request.args)

        if params and params.errors:
            return {"errors": params.errors}, 400

        from_time = params.data["range"]
        if from_time.endswith("h"):
            from_time = int(from_time[:-1])
        elif from_time.endswith("d"):
            from_time = int(from_time[:-1]) * 24
        elif from_time != "*":
            raise BadRequest("Wrong range format")

        query = (
            db.session.query(
                Config.family,
                func.max(Config.upload_time).label('maxdate'),
                func.count()
            ).group_by(Config.family)
        )

        if from_time != "*":
            query = query.filter(Config.upload_time > (datetime.now() - timedelta(hours=from_time)))

        families = [
            {
                "family": family,
                "last_upload": upload_time,
                "count": count
            } for family, upload_time, count in query.all()
        ]

        schema = ConfigStatsResponseSchema()
        return schema.dump({"families": families})
