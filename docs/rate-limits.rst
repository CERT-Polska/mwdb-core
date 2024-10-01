Rate limit configuration
========================

.. versionadded:: 2.7.0

MWDB allows you to set a rate limit that gives more control over API usage by users.

.. warning::

    This feature requires Redis database to be configured.

Global rate-limit configuration
-------------------------------

To enable rate limiting, set ``enable_rate_limit`` option in `mwdb.ini`` or ``MWDB_ENABLE_RATE_LIMIT`` environment variable to ``1``.

mwdb-core comes with hardcoded default limits that are applied depending on HTTP method. The default values are as below:

* GET method: 1000/10second 2000/minute 6000/5minute 10000/15minute
* POST method: 100/10second 1000/minute 3000/5minute 6000/15minute
* PUT method: 100/10second 1000/minute 3000/5minute 6000/15minute
* DELETE method: 100/10second 1000/minute 3000/5minute 6000/15minute

User can override these limits for individual endpoints by placing new limits in ``mwdb.ini`` - in section ``[mwdb_limiter]``.
Each line in ``[mwdb_limiter]`` section should have a pattern - ``<resourcename>_<httpmethod> = limit_values_space_separated``.

Example rate-limit records in mwdb.ini file are as below

.. code-block::

    [mwdb_limiter]
    file_get = 100/10second
    textblob_post = 10/second 1000/minute 3000/15minute
    attributedefinition_delete = 10/minute 100/hour

Above records establish request rate limits for endpoints:

* GET /api/file to value: 100 per 10 seconds
* POST /api/blob to values: 10 per second, 1000 per minute and 3000 per 15 minutes
* DELETE /api/attribute/<key> to values: 10 per minute and 100 per hour

Other endpoints are limited by default limits.

Limiter configuration follows the same rules as other configuration fields and can be set using environment variables e.g.
``MWDB_LIMITER_TEXTBLOB_POST="10/second 1000/minute 3000/15minute``.

.. note::

   Complete list of possible rate-limit parameters is placed in ``mwdb-core\mwdb\core\templates\mwdb.ini.tmpl`` file - section ``mwdb_limiter``.

   If your MWDB instance uses standalone installation and MWDB backend is behind reverse proxy, make sure that use_x_forwarded_for is set to 1
   and your reverse proxy correctly sets X-Forwarded-For header with real remote IP.

Group-based rate limit configuration
------------------------------------

.. versionadded:: 2.14.0

mwdb-core in version v2.14.0 extends the limit key syntax and allows you to set custom rate limits for a specific group of users.

Complete key format is:

* ``(group_<group_name>)_(<resource_name>)_(<method>)`` - to set limits for members of group <group_name>
* ``(unauthenticated)_(<resource_name>)_(<method>)`` - to set limits only for unauthenticated users

where any key in parentheses may be excluded to have a more generic key.

Examples:

* 10/second limit for members of group called "limited_users": ``group_limited_users = 10/second``
* 10/second or 30/minute for members of "limited_users" but only for POST requests : ``group_limited_users_post = 10/second 30/minute``
* 1/second for unauthenticated users and for all requests: ``unauthenticated = 1/second``
