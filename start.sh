#!/bin/sh

echo "Waiting for DB to become operational"
until psql "$MALWARECAGE_POSTGRES_URI" -c "\q" ; do
    >&2 echo "Waiting for postgres"
    sleep 1
done

echo "Applying DB upgrade..."
flask db upgrade

if [ "$MALWARECAGE_ADMIN_LOGIN" == "" ] || [ "$MALWARECAGE_ADMIN_EMAIL" == "" ] || [ "$MALWARECAGE_ADMIN_PASSWORD" == "" ]
then
    echo "Variable MALWARECAGE_ADMIN_LOGIN, MALWARECAGE_ADMIN_EMAIL or MALWARECAGE_ADMIN_PASSWORD is not set. Not going to create initial admin account..."
else
    echo "Creating initial admin account..."
    flask create_admin --require-empty "$MALWARECAGE_ADMIN_LOGIN" "$MALWARECAGE_ADMIN_EMAIL" "$MALWARECAGE_ADMIN_PASSWORD"
fi

exec uwsgi --ini /app/uwsgi.ini
