#!/bin/sh

echo "Waiting for DB to become operational"
until psql "$MWDB_POSTGRES_URI" -c "\q" ; do
    >&2 echo "Waiting for postgres"
    sleep 1
done

echo "Configuring mwdb-core instance"
/app/venv/bin/mwdb-core configure --quiet basic && uv run /app/venv/bin/gunicorn
