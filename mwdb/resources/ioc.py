from flask import request
from werkzeug.exceptions import BadRequest, NotFound

from mwdb.core.capabilities import Capabilities
from mwdb.core.ioc import BaseIOC, IOCUpdate
from mwdb.core.search.exceptions import QueryBaseException
from mwdb.core.search.ioc_search import build_ioc_query
from mwdb.core.service import Resource
from mwdb.model import IOC, db
from mwdb.schema.ioc import (
    IOCItemResponseSchema,
    IOCListRequestSchema,
    IOCRequestSchema,
    IOCUpdateRequestSchema,
)

from . import (
    access_object,
    load_schema,
    loads_schema,
    logger,
    requires_authorization,
    requires_capabilities,
)


class IOCListResource(Resource):
    @requires_authorization
    def get(self):
        """
        ---
        summary: List all IOCs
        description: |
            Returns list of all IOCs, ordered from newest to oldest.
            Use `older_than` for cursor-based pagination.
        security:
            - bearerAuth: []
        tags:
            - ioc
        parameters:
            - in: query
              name: older_than
              schema:
                type: integer
              description: |
                  Fetch IOCs older than the IOC with this id.
                  Used for pagination.
              required: false
            - in: query
              name: count
              schema:
                type: integer
              description: Number of IOCs to return
              required: false
              default: 10
        responses:
            200:
                description: List of IOCs
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        obj = load_schema(request.args, IOCListRequestSchema())

        search = obj.get("query")
        if search:
            try:
                query = build_ioc_query(search)
            except QueryBaseException as e:
                raise BadRequest(str(e))
        else:
            query = db.session.query(IOC)

        query = query.order_by(IOC.creation_time.desc(), IOC.id.desc())

        if obj["older_than"]:
            pivot = db.session.query(IOC).get(obj["older_than"])
            if pivot is not None:
                query = query.filter(
                    db.or_(
                        IOC.creation_time < pivot.creation_time,
                        db.and_(
                            IOC.creation_time == pivot.creation_time,
                            IOC.id < pivot.id,
                        ),
                    )
                )

        limit = min(obj["count"], 1000)
        iocs = query.limit(limit).all()

        schema = IOCItemResponseSchema(many=True)
        return {"iocs": schema.dump(iocs)}


class IOCManageResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.adding_iocs)
    def put(self, ioc_id):
        """
        ---
        summary: Update an IOC
        description: |
            Update IOC properties (category, severity, tags).

            Requires `adding_iocs` capability.
        security:
            - bearerAuth: []
        tags:
            - ioc
        parameters:
            - in: path
              name: ioc_id
              schema:
                type: integer
              description: IOC id
        requestBody:
            description: IOC update data
            content:
              application/json:
                schema: IOCUpdateRequestSchema
        responses:
            200:
                description: Updated IOC
            403:
                description: When user doesn't have `adding_iocs` capability.
            404:
                description: When IOC doesn't exist.
        """
        schema = IOCUpdateRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        try:
            update = IOCUpdate.from_dict(obj)
        except ValueError as e:
            raise BadRequest(str(e))

        ioc = db.session.query(IOC).get(ioc_id)
        if ioc is None:
            raise NotFound("IOC not found")

        ioc.apply_update(update)
        db.session.commit()

        logger.info(
            "IOC updated",
            extra={"ioc_id": ioc_id},
        )

        response_schema = IOCItemResponseSchema()
        return response_schema.dump(ioc)

    @requires_authorization
    @requires_capabilities(Capabilities.removing_iocs)
    def delete(self, ioc_id):
        """
        ---
        summary: Delete an IOC
        description: |
            Permanently deletes an IOC and all its object links.

            Requires `removing_iocs` capability.
        security:
            - bearerAuth: []
        tags:
            - ioc
        parameters:
            - in: path
              name: ioc_id
              schema:
                type: integer
              description: IOC id
        responses:
            200:
                description: When IOC is successfully deleted
            403:
                description: When user doesn't have `removing_iocs` capability.
            404:
                description: When IOC doesn't exist.
        """
        ioc = db.session.query(IOC).get(ioc_id)
        if ioc is None:
            raise NotFound("IOC not found")

        logger.info(
            "IOC deleted",
            extra={
                "ioc_id": ioc_id,
                "ioc_type": ioc.type,
                "ioc_value": ioc.value,
            },
        )

        db.session.delete(ioc)
        db.session.commit()

        return {"message": "IOC deleted"}


class IOCResource(Resource):
    @requires_authorization
    def get(self, type, identifier):
        """
        ---
        summary: Get object IOCs
        description: |
            Returns IOCs linked to an object.
        security:
            - bearerAuth: []
        tags:
            - ioc
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
                description: List of object IOCs
            404:
                description: |
                    When object doesn't exist or user doesn't have
                    access to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        iocs = db_object.get_iocs()
        schema = IOCItemResponseSchema(many=True)
        return schema.dump(iocs)

    @requires_authorization
    @requires_capabilities(Capabilities.adding_iocs)
    def put(self, type, identifier):
        """
        ---
        summary: Add IOC to object
        description: |
            Add a new IOC to an object. If the IOC already exists
            (same type and value), it will be reused.

            Requires `adding_iocs` capability.
        security:
            - bearerAuth: []
        tags:
            - ioc
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
            description: IOC data
            content:
              application/json:
                schema: IOCRequestSchema
        responses:
            200:
                description: When IOC is successfully added
            400:
                description: When IOC data is invalid
            403:
                description: When user doesn't have `adding_iocs` capability.
            404:
                description: |
                    When object doesn't exist or user doesn't have
                    access to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        schema = IOCRequestSchema()
        obj = loads_schema(request.get_data(as_text=True), schema)

        try:
            ioc_data = BaseIOC.from_dict(obj)
        except ValueError as e:
            raise BadRequest(str(e))

        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        ioc, is_new = db_object.add_ioc(ioc_data)

        logger.info(
            "IOC added",
            extra={
                "ioc_type": ioc_data.IOC_TYPE.value,
                "ioc_value": ioc_data.value,
                "dhash": db_object.dhash,
            },
        )

        iocs = db_object.get_iocs()
        schema = IOCItemResponseSchema(many=True)
        return schema.dump(iocs)


class IOCItemResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.removing_iocs)
    def delete(self, type, identifier, ioc_id):
        """
        ---
        summary: Remove IOC from object
        description: |
            Removes IOC link from object.

            Requires `removing_iocs` capability.
        security:
            - bearerAuth: []
        tags:
            - ioc
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
            - in: path
              name: ioc_id
              schema:
                type: integer
              description: IOC id to remove
        responses:
            200:
                description: When IOC is successfully removed
            403:
                description: When user doesn't have `removing_iocs` capability.
            404:
                description: |
                    When object doesn't exist or user doesn't have
                    access to this object.
            503:
                description: |
                    Request canceled due to database statement timeout.
        """
        db_object = access_object(type, identifier)
        if db_object is None:
            raise NotFound("Object not found")

        removed = db_object.remove_ioc(ioc_id)
        if not removed:
            raise NotFound("IOC not found on this object")

        logger.info(
            "IOC removed",
            extra={
                "ioc_id": ioc_id,
                "dhash": db_object.dhash,
            },
        )

        iocs = db_object.get_iocs()
        schema = IOCItemResponseSchema(many=True)
        return schema.dump(iocs)
