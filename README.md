**This is a pre-release version.** You're welcome to try it, but if you want a smooth installation experience and stable interface you should wait for the official release instead.

We're working hard to deliver all of these things as soon as possible. Stay tuned and [follow our Twitter](https://twitter.com/CERT_Polska_en)!

# MWDB

Malware repository component for automated malware collection/analysis systems. 

Formerly known as Malwarecage.

Under the hood of [mwdb.cert.pl service](https://mwdb.cert.pl) hosted by CERT.pl.

**Features:**

- Storage for malware binaries and static/dynamic malware configurations
- Tracking and visualizing relations between objects
- Quick search
- Data sharing and user management mechanism
- Integration capabilities via webhooks and plugin system

## Basic installation via Docker Compose

The first step is to generate configuration using `./gen_vars.sh` script.

```
$ ./gen_vars.sh 
Credentials for initial mwdb account:

-----------------------------------------
Admin login: admin
Admin password: la/Z7MsmKA3UxW8Psrk1Opap
-----------------------------------------

Please be aware that initial account will be only set up on the first run. If you already have a database with at least one user, then this setting will be ignored for security reasons. You can always create an admin account manually by executing a command. See "flask create_admin --help" for reference.
```

Then build images via `docker-compose build` and run MWDB via `docker-compose up -d`.

MWDB should be accessible via `http://127.0.0.1`

You can customize your MWDB installation e.g. by adding persistent volumes to `docker-compose.yml`:

```yaml
services:
  ...
  mwdb:
    ...
    volumes:
      - type: volume
        source: mwcage-uploads
        target: /app/uploads
  postgres:
    ...
    volumes:
      - type: volume
        source: mwcage-postgres
        target: /var/lib/postgresql/data
  ...
volumes:
    mwcage-postgres:
    mwcage-uploads:
```

## Development environment

Generate configuration using `./gen_vars.sh` as for production installation.

Then build images using `docker-compose -f docker-compose-dev.yml build`. Then run MWDB via 
`docker-compose -f docker-compose-dev.yml up -d`.  

After a minute - MWDB should be accessible via `http://127.0.0.1` with enabled hot-reload and debug facilities.

All changes in code are automatically reloaded excluding:
- Changes in database model, which needs migrations
- Changes in configuration
- Registering new plugins or adding frontend extension to existing plugins without that feature

In cases mentioned above - Docker images need to be rebuilt.

Password for administration account is available in `mwdb-vars.env` file in `MWDB_ADMIN_PASSWORD` field.

#### Testing mail-related features

Development environment is configured to use [Mailhog](https://github.com/mailhog/MailHog) as SMTP server.

Mailhog provides very convenient webmail collecting all outgoing e-mails which are available here: http://127.0.0.1:8025

#### Auto generating Alembic migrations

Let's say you made changes in model (e.g. added some table) but your feature still doesn't work and MWDB reports that something is wrong with database. That's because you need to provide appropriate migration script, that will apply your model changes to database. Fortunately, [Alembic is very helpful](https://alembic.sqlalchemy.org/en/latest/autogenerate.html) when we deal with simple changes like providing new nullable columns or dropping the tables.

```diff
 class Comment(db.Model):
     __tablename__ = 'comment'
     id = db.Column(db.Integer, primary_key=True)
     comment = db.Column(db.String, nullable=False, info=ColumnToSearchInDict)
+    likes = db.Column(db.Integer)
     timestamp = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
```

In development version of Docker Compose file, migrations are mounted as volume, so we can use Flask CLI features directly from the container.

Make sure that development Docker Compose is up. Then spawn interactive shell:

```
$ docker-compose -f docker-compose-dev.yml exec mwdb /bin/sh
/app #
```

Then use `flask db migrate` command to generate migration

```
/app # flask db migrate
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.ddl.postgresql] Detected sequence named 'tag_id_seq' as owned by integer column 'tag(id)', assuming SERIAL and omitting
INFO  [alembic.ddl.postgresql] Detected sequence named 'object_id_seq' as owned by integer column 'object(id)', assuming SERIAL and omitting
INFO  [alembic.ddl.postgresql] Detected sequence named 'comment_id_seq' as owned by integer column 'comment(id)', assuming SERIAL and omitting
INFO  [alembic.ddl.postgresql] Detected sequence named 'metakey_id_seq' as owned by integer column 'metakey(id)', assuming SERIAL and omitting
INFO  [alembic.autogenerate.compare] Detected added column 'comment.likes'
  Generating /app/migrations/versions/c22b64a416e9_.py ... done
```

In this case we can find our migration script `./migrations/versions/c22b64a416e9_.py`. Check if everything is alright and apply migration.

```
/app # flask db upgrade
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade 426a27b8e97c -> c22b64a416e9, empty message
```

Now, your feature is ready for tests. If you restart your Docker environment, all migrations will be applied automatically.

If you need to write change on your own e.g. because you need to migrate data instead of schema: use `flask db revision`

```
/app # flask db revision
  Generating /app/migrations/versions/6819021086c5_.py ... done
```

> **Note:**
>
> Alembic migrations generated inside container will be owned by root.
> If you have problem with permissions, use chown inside container to change the owner to your local UID.

## Standalone installation

Currently it's quite complicated, but we'll provide appropriate instructions until final release. (TODO)

## Contact
If you have any problems, bugs or feature requests related to MWDB, you're encouraged to create a GitHub issue. If you have other questions, question is related strictly with mwdb.cert.pl service or you want to contact the current maintainers directly, you can email:

- Paweł Srokosz (psrok1@cert.pl)
- Jarosław Jedynak (msm@cert.pl)
- CERT.PL (info@cert.pl)

## Contact

In case of any questions, send an e-mail to info@cert.pl

![Co-financed by the Connecting Europe Facility by of the European Union](https://www.cert.pl/wp-content/uploads/2019/02/en_horizontal_cef_logo-1.png)
