#!/bin/sh

echo "Waiting for DB to become operational"
until psql "$MWDB_POSTGRES_URI" -c "\q" ; do
    >&2 echo "Waiting for postgres"
    sleep 1
done

echo "Configuring mwdb-core instance"
mwdb-core configure --quiet basic

exec uwsgi --ini /app/uwsgi.ini
