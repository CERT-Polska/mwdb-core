from flask import Response
from prometheus_client import CONTENT_TYPE_LATEST

from mwdb.core.capabilities import Capabilities
from mwdb.core.metrics import collect
from mwdb.core.service import Resource

from . import requires_authorization, requires_capabilities


class MetricsResource(Resource):
    @requires_authorization
    @requires_capabilities(Capabilities.access_prometheus_metrics)
    def get(self):
        """
        ---
        summary: Get Prometheus metrics
        description: |
            Returns metrics for Prometheus.

            Requires 'access_prometheus_metrics' privilege
        security:
            - bearerAuth: []
        tags:
            - metrics
        responses:
            200:
                description: Metrics in Prometheus format
            403:
                description: |
                    User don't have 'access_prometheus_metrics' privilege.
        """
        metrics = collect()
        return Response(
            metrics,
            content_type=CONTENT_TYPE_LATEST,
        )
