Prometheus metrics
==================

.. versionadded:: 2.12.0

MWDB allows to enable Prometheus metrics to grab information about API usage by users.

.. warning::

    This feature requires Redis database to be configured.

Available metrics:

- ``mwdb_api_requests (method, endpoint, user, status_code)`` that tracks usage of specific endpoints by users and status codes.
- ``mwdb_deprecated_usage (feature, method, endpoint, user)`` that tracks usage of deprecated API endpoints

Useful PromQL queries (in most cases we use 5-minute window):

- ``sum(increase(mwdb_api_requests{}[5m])/5) by (user)`` - counts general API usage by MWDB users in requests per minute
- ``sum(increase(mwdb_api_requests{status_code != "200"}[5m])) by (user, status_code)`` - API error rate grouped by user and status_code
- ``sum(increase(mwdb_api_requests{endpoint=~"api.filedownloadresource|api.requestsampledownloadresource|api.downloadresource|api.filedownloadzipresource", method="GET"}[5m])/5) by (user)`` - file download rate
- ``sum(increase(mwdb_api_requests{endpoint=~"api.fileresource|api.fileitemresource", method="POST"}[5m])/5) by (user)`` - file upload rate

Setup guide
-----------

1. First, you need to configure Redis server where metric counters are stored. Redis instance can be configured in MWDB via
   ``redis_uri`` option in mwdb.ini file or ``MWDB_REDIS_URI`` environment variable.

2. Then you need to enable metrics by setting ``enable_prometheus_metrics=1`` in configuration or ``MWDB_ENABLE_PROMETHEUS_METRICS=1`` in env vars

3. Log in as admin in MWDB and go to http://<mwdb>/settings/users. Create user account that will be used to access prometheus metrics.

4. Go to ``Check user capabilities`` or http://<mwdb>/settings/user/<username>/capabilities to set ``access_prometheus_metrics`` ACL for created account.

5. Then generate API key on http://<mwdb>>/settings/user/<username>/api-keys that will be used to scrape metrics by Prometheus

After setup, metrics can be scraped using ``http://<mwdb-api>/api/varz`` endpoint with API key provided in ``Authorization: Bearer <api_key>`` HTTP header.

You can test it before setting up Prometheus using curl:

.. code-block:: console

   $ curl http://<mwdb-api>/api/varz -H 'Authorization: Bearer <api_key>'

Detailed instructions about Prometheus configuration can be found in `Prometheus docs <https://prometheus.io/docs/prometheus/latest/configuration/configuration/>`_.
