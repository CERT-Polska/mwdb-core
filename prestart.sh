#!/bin/bash

if [ "$SQLALCHEMY_DATABASE_URI" == "" ]
then
    SQLALCHEMY_DATABASE_URI=`cat /etc/mwdb/sqlalchemy_database_uri`
fi

echo "Waiting for DB to become operational"
until psql "$SQLALCHEMY_DATABASE_URI" -c "\q" ; do
    >&2 echo "Waiting for postgres"
    sleep 1
done

echo "Applying DB upgrade..."
flask db upgrade

if [ "$MWDB_ADMIN_LOGIN" == "" ] || [ "$MWDB_ADMIN_EMAIL" == "" ] || [ "$MWDB_ADMIN_PASSWORD" == "" ]
then
    echo "Variable MWDB_ADMIN_LOGIN, MWDB_ADMIN_EMAIL or MWDB_ADMIN_PASSWORD is not set. Not going to create initial admin account..."
else
    echo "Creating initial admin account..."
    flask create_admin --require-empty "$MWDB_ADMIN_LOGIN" "$MWDB_ADMIN_EMAIL" "$MWDB_ADMIN_PASSWORD"
fi
