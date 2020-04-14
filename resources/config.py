from datetime import datetime, timedelta

from flask import g, request
from flask_restful import Resource
from sqlalchemy import func

from plugin_engine import hooks
from model import Config, db
from core.config import app_config
from core.schema import ConfigShowSchema, MultiConfigSchema, ConfigStatsSchema
from core.util import config_dhash

from . import requires_authorization
from .object import ObjectResource, ObjectListResource


class ConfigStatsResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        description: get static config global statistics
        security:
            - bearerAuth: []
        tags:
            - config
        parameters:
            - in: query
              name: range
              schema:
                type: str
              description: Time range in hours "24h" (or days e.g. "2d")
              required: false
        responses:
            200:
                description: Static config global statistics
                content:
                  application/json:
                    schema: ConfigStatsSchema
        """
        from_time = request.args.get('range', '*')
        if from_time.endswith("h"):
            from_time = int(from_time[:-1])
        elif from_time.endswith("d"):
            from_time = int(from_time[:-1]) * 24

        query = db.session\
            .query(Config.family,
                   func.max(Config.upload_time).label('maxdate'),
                   func.count())\
            .group_by(Config.family)

        if from_time != "*":
            query = query.filter(Config.upload_time > (datetime.now() - timedelta(hours=from_time)))

        families = [{"family": family,
                     "last_upload": upload_time,
                     "count": count} for family, upload_time, count in query.all()]

        schema = ConfigStatsSchema()
        return schema.dump({"families": families})


class ConfigListResource(ObjectListResource):
    ObjectType = Config
    Schema = MultiConfigSchema
    SchemaKey = "configs"

    @requires_authorization
    def get(self):
        """
        ---
        description: Retrieves list of configs
        security:
            - bearerAuth: []
        tags:
            - config
        parameters:
            - in: query
              name: older_than
              schema:
                type: string
              description: fetch objects which are older than the object specified by SHA256 identifier
              required: false
            - in: query
              name: query
              schema:
                type: string
              description: Filter results using Lucene query
        responses:
            200:
                description: List of configs
                content:
                  application/json:
                    schema: MultiConfigSchema
            400:
                description: Syntax error in Lucene query
        """
        return super(ConfigListResource, self).get()


class ConfigResource(ObjectResource):
    ObjectType = Config
    ObjectTypeStr = Config.__tablename__
    Schema = ConfigShowSchema
    on_created = hooks.on_created_config
    on_reuploaded = hooks.on_reuploaded_config

    @requires_authorization
    def get(self, identifier):
        """
        ---
        description: Fetch config information by hash
        security:
            - bearerAuth: []
        tags:
            - config
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: Config unique identifier
        responses:
            200:
                description: When config was found
                content:
                  application/json:
                    schema: ConfigShowSchema
            404:
                description: When object was not found
        """
        return super(ConfigResource, self).get(identifier)

    def create_object(self, obj):
        cfg = obj.data.get('cfg')

        dhash = config_dhash(cfg)

        db_cfg = Config()
        db_cfg.cfg = cfg
        db_cfg.family = obj.data.get('family')
        db_cfg.config_type = obj.data.get('config_type', 'static')
        db_cfg.dhash = dhash
        db_cfg.upload_time = datetime.now()

        if app_config.malwarecage.enable_maintenance and g.auth_user.login == app_config.malwarecage.admin_login:
            db_cfg.upload_time = obj.data.get("upload_time", datetime.now())

        db_cfg, is_cfg_new = Config.get_or_create(db_cfg)
        return db_cfg, is_cfg_new

    @requires_authorization
    def put(self, identifier):
        """
        ---
        description: Add config to given file
        security:
            - bearerAuth: []
        tags:
            - config
        parameters:
            - in: path
              name: identifier
              schema:
                type: string
              description: SHA256 or MD5 parent file unique identifier
        requestBody:
            required: true
            content:
              multipart/form-data:
                schema:
                  type: object
                  description: Uploaded configuration parameters (verbose mode)
                  properties:
                    json:
                      type: string
                      format: binary
                      description: Configuration to be uploaded
                    metakeys:
                      type: string
                      description: Optional JSON-encoded `MetakeyShowSchema` (only for permitted users)
                    upload_as:
                      type: string
                      default: '*'
                      description: Identity used for uploading sample
                  required:
                    - json
              application/json:
                schema:
                  type: object
                  description: Configuration to be uploaded (simple mode)
                  properties:
                    family:
                      type: string
                      description: Malware family related with configuration
                    config_type:
                      type: string
                      description: Config type (static, dynamic, other)
                      default: static
                  required:
                    - family
        responses:
            200:
                description: Config uploaded succesfully
                content:
                  application/json:
                    schema: FileShowSchema
            403:
                description: No permissions to perform additional operations (e.g. adding metakeys)
            404:
                description: Specified group doesn't exist
            409:
                description: Object exists yet but has different type
        """
        return super(ConfigResource, self).put(identifier)
