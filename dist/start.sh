#!/bin/sh

echo "Waiting for DB to become operational"
until psql "$MALWARECAGE_POSTGRES_URI" -c "\q" ; do
    >&2 echo "Waiting for postgres"
    sleep 1
done

echo "Configuring Malwarecage instance"
malwarecage configure --quiet basic

exec uwsgi --ini /app/uwsgi.ini
