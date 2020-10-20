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

    docker-compose -f docker-compose-dev.yml up -d``

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

You may also add any external SMTP server using the following enviornment variables:

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

   $ docker-compose -f docker-compose-dev.yml exec mwdb /bin/sh
   /app #

Then use ``flask db migrate`` command to generate migration

.. code-block::

   /app # flask db migrate
   INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
   INFO  [alembic.runtime.migration] Will assume transactional DDL.
   INFO  [alembic.ddl.postgresql] Detected sequence named 'tag_id_seq' as owned by integer column 'tag(id)', assuming SERIAL and omitting
   INFO  [alembic.ddl.postgresql] Detected sequence named 'object_id_seq' as owned by integer column 'object(id)', assuming SERIAL and omitting
   INFO  [alembic.ddl.postgresql] Detected sequence named 'comment_id_seq' as owned by integer column 'comment(id)', assuming SERIAL and omitting
   INFO  [alembic.ddl.postgresql] Detected sequence named 'metakey_id_seq' as owned by integer column 'metakey(id)', assuming SERIAL and omitting
   INFO  [alembic.autogenerate.compare] Detected added column 'comment.likes'
     Generating /app/migrations/versions/c22b64a416e9_.py ... done

In this case we can find our migration script ``./migrations/versions/c22b64a416e9_.py``. Check if everything is alright and apply migration.

.. code-block::

   /app # flask db upgrade
   INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
   INFO  [alembic.runtime.migration] Will assume transactional DDL.
   INFO  [alembic.runtime.migration] Running upgrade 426a27b8e97c -> c22b64a416e9, empty message

Now, your feature is ready for tests. If you restart your Docker environment, all migrations will be applied automatically.

If you need to write change on your own e.g. because you need to migrate data instead of schema: use ``flask db revision``

.. code-block::

   /app # flask db revision
     Generating /app/migrations/versions/6819021086c5_.py ... done

.. note::

   Alembic migrations generated inside container will be owned by root.
   If you have problem with permissions, use ``chown`` inside container to change the owner to your local UID.

