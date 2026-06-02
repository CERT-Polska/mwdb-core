Developer guide
===============

Setting up development environment
----------------------------------

Generate configuration using ``./gen_vars.sh`` as for production installation.

Then build images using 

.. code-block::

    docker-compose -f docker-compose-dev.yml build

and run MWDB via 

.. code-block::

    docker-compose -f docker-compose-dev.yml up -d

After a minute - MWDB should be accessible via ``http://127.0.0.1`` with enabled hot-reload and debug facilities.

All changes in code are automatically reloaded excluding:


* Changes in database model, which need migrations
* Changes in configuration
* Registering new plugins or adding frontend extension to existing plugins without that feature

In cases mentioned above - Docker images need to be rebuilt.

Password for administration account is available in ``mwdb-vars.env`` file in ``MWDB_ADMIN_PASSWORD`` field.

Testing mail-related features
-----------------------------

Development environment is configured to use `Mailhog <https://github.com/mailhog/MailHog>`_ as SMTP server.

Mailhog provides very convenient webmail collecting all outgoing e-mails which are available here: http://127.0.0.1:8025

You may also add any external SMTP server using the following environment variables:

.. code-block::

    MWDB_MAIL_SMTP = "smtp_server:port"
    MWDB_MAIL_FROM = "name@example.com"
    MWDB_MAIL_USERNAME = "your_username" # optional
    MWDB_MAIL_PASSWORD = "your_password" # optional
    MWDB_MAIL_TLS = 1 # Enables StartTLS, optional, defaults to 0

Auto generating Alembic migrations
----------------------------------

Let's say you made changes in model (e.g. added some table) but your feature still doesn't work and MWDB reports that something is wrong with database. That's because you need to provide appropriate migration script, that will apply your model changes to database. Fortunately, `Alembic is very helpful <https://alembic.sqlalchemy.org/en/latest/autogenerate.html>`_ when we deal with simple changes like providing new nullable columns or dropping the tables.

.. code-block:: diff

    class Comment(db.Model):
        __tablename__ = 'comment'
        id = db.Column(db.Integer, primary_key=True)
        comment = db.Column(db.String, nullable=False, info=ColumnToSearchInDict)
   +    likes = db.Column(db.Integer)
        timestamp = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

In development version of Docker Compose file, migrations are mounted as volume, so we can use Flask CLI features directly from the container.

Make sure that development Docker Compose is up. Then spawn interactive shell:

.. code-block::

   $ docker compose -f docker-compose-dev.yml exec -u $(id -u) mwdb /bin/sh
   /app #

Then enter the virtualenv:

.. code-block::
    $ . .venv/bin/activate

And use ``flask db migrate`` command to generate migration

.. code-block::

   $ flask db migrate -m "my change"
   INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
   INFO  [alembic.runtime.migration] Will assume transactional DDL.
   INFO  [alembic.ddl.postgresql] Detected sequence named 'tag_id_seq' as owned by integer column 'tag(id)', assuming SERIAL and omitting
   INFO  [alembic.ddl.postgresql] Detected sequence named 'object_id_seq' as owned by integer column 'object(id)', assuming SERIAL and omitting
   INFO  [alembic.ddl.postgresql] Detected sequence named 'comment_id_seq' as owned by integer column 'comment(id)', assuming SERIAL and omitting
   INFO  [alembic.ddl.postgresql] Detected sequence named 'metakey_id_seq' as owned by integer column 'metakey(id)', assuming SERIAL and omitting
   INFO  [alembic.autogenerate.compare] Detected added column 'comment.likes'
     Generating /app/migrations/versions/c22b64a416e9_my_change.py ... done

In this case we can find our migration script ``./migrations/versions/c22b64a416e9_my_change.py``. Check if everything is alright and apply migration.

.. code-block::

   $ flask db upgrade
   INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
   INFO  [alembic.runtime.migration] Will assume transactional DDL.
   INFO  [alembic.runtime.migration] Running upgrade 426a27b8e97c -> c22b64a416e9, my change

Now, your feature is ready for tests. If you restart your Docker environment, all migrations will be applied automatically.

If you need to write change on your own e.g. because you need to migrate data instead of schema: use ``flask db revision``

.. code-block::

    $ flask db revision -m "my change"

    Generating /app/mwdb/model/migrations/versions/be5a821ebbcf_my_change.py ...  done

.. note::

   Alembic migrations generated inside container may have wrong owner (especially group id).
   If you have problem with permissions, use ``chown`` to change the owner to your local UID/GID.

Debugging database problems
---------------------------

MWDB Core has built-in SQL logging features that are helpful while debugging slow queries and N+1 query problems.

If you want to have logged all queries in the application:

- set ``enable_sql_profiler=1`` (e.g. via ``MWDB_ENABLE_SQL_PROFILER=1`` environment variable)
- set ``enable_debug_log=1``

This will emit the following logs:

- ``funcName: before_cursor_execute`` - SQL query and context before execution
- ``funcName: after_cursor_execute`` - SQL query, context and timing after execution
- ``funcName: log_request`` - contains additional record ``sql_queries_count`` with count of SQL queries
  emitted during handling request

.. code-block::

    mwdb-1      | {"funcName": "before_cursor_execute", "levelname": "DEBUG", "message": "Query started", "taskName": null, "sql": "SELECT \"user\".id AS user_id, \"user\".login AS user_login, \"user\".email AS user_email, \"user\".password_hash AS user_password_hash, \"user\".version_uid AS user_version_uid, \"user\".password_ver AS user_password_ver, \"user\".identity_ver AS user_identity_ver, \"user\".additional_info AS user_additional_info, \"user\".disabled AS user_disabled, \"user\".pending AS user_pending, \"user\".requested_on AS user_requested_on, \"user\".registered_on AS user_registered_on, \"user\".registered_by AS user_registered_by, \"user\".logged_on AS user_logged_on, \"user\".set_password_on AS user_set_password_on, \"user\".feed_quality AS user_feed_quality \nFROM \"user\" \nWHERE \"user\".pending = true", "parameters": {}, "path": "/api/user", "method": "GET", "request_id": "eda86733df3302bc86a78da7ba936eaa", "file": "/app/mwdb/resources/user.py", "line": 75, "function": "get", "timestamp": "2026-06-02T13:57:43.390940+00:00"}
    mwdb-1      | {"funcName": "after_cursor_execute", "levelname": "DEBUG", "message": "Query finished, took 0.002081 seconds", "taskName": null, "sql": "SELECT \"user\".id AS user_id, \"user\".login AS user_login, \"user\".email AS user_email, \"user\".password_hash AS user_password_hash, \"user\".version_uid AS user_version_uid, \"user\".password_ver AS user_password_ver, \"user\".identity_ver AS user_identity_ver, \"user\".additional_info AS user_additional_info, \"user\".disabled AS user_disabled, \"user\".pending AS user_pending, \"user\".requested_on AS user_requested_on, \"user\".registered_on AS user_registered_on, \"user\".registered_by AS user_registered_by, \"user\".logged_on AS user_logged_on, \"user\".set_password_on AS user_set_password_on, \"user\".feed_quality AS user_feed_quality \nFROM \"user\" \nWHERE \"user\".pending = true", "parameters": {}, "path": "/api/user", "method": "GET", "request_id": "eda86733df3302bc86a78da7ba936eaa", "file": "/app/mwdb/resources/user.py", "line": 75, "function": "get", "timestamp": "2026-06-02T13:57:43.393037+00:00"}
    mwdb-1      | {"funcName": "log_request", "levelname": "DEBUG", "message": "request", "taskName": null, "path": "/api/user", "arguments": {"pending": "1"}, "method": "GET", "status": 200, "response_time": "0:00:00.024094", "response_size": 13, "remote_addr": "172.18.0.7", "pid": 685, "sql_queries_count": 4, "auth_user": "admin", "request_id": "eda86733df3302bc86a78da7ba936eaa", "timestamp": "2026-06-02T13:57:43.394061+00:00"}

If you want to emit warning logs for each query that takes longer than 5 seconds to execute:

- set ``enable_sql_profiler=1`` (e.g. via ``MWDB_ENABLE_SQL_PROFILER=1`` environment variable)
- set ``log_only_slow_sql=1``
