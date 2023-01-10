#!/bin/sh

echo "Waiting for DB to become operational"
until psql "$MWDB_POSTGRES_URI" -c "\q" ; do
    >&2 echo "Waiting for postgres"
    sleep 1
done

if [[ $HOT_RELOAD ]]; then
    RELOAD="--reload"
fi

echo "Configuring mwdb-core instance"
mwdb-core configure --quiet basic && exec gunicorn ${RELOAD} --bind 0.0.0.0:8080 --user nobody mwdb.app:app
