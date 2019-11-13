#!/bin/sh

ADMIN_PASSWORD=$(openssl rand -base64 18)
POSTGRES_PASSWORD=$(openssl rand -hex 18)
SECRET_KEY=$(openssl rand -base64 18)

echo "REDIS_DATABASE_URI=redis://redis/" > mwdb-vars.env
echo "SQLALCHEMY_DATABASE_URI=postgresql://mwdb:$POSTGRES_PASSWORD@postgres/mwdb" >> mwdb-vars.env
echo "SECRET_KEY=$SECRET_KEY" >> mwdb-vars.env
echo "MWDB_ADMIN_LOGIN=admin" >> mwdb-vars.env
echo "MWDB_ADMIN_EMAIL=admin@localhost" >> mwdb-vars.env
echo "MWDB_ADMIN_PASSWORD=$ADMIN_PASSWORD" >> mwdb-vars.env
echo "BASE_URL=http://127.0.0.1" >> mwdb-vars.env

if [ "$1" != "raw" ]
then
    echo "Credentials for initial mwdb account:"
    echo ""
    echo "-----------------------------------------"
    echo "Admin login: admin"
    echo "Admin password: $ADMIN_PASSWORD"
    echo "-----------------------------------------"
    echo ""
    echo "Please be aware that initial account will be only set up on the first run. If you already have a database with at least one user, then this setting will be ignored for security reasons. You can always create an admin account manually by executing a command. See \"flask create_admin --help\" for reference."
else
    echo -n "$ADMIN_PASSWORD"
fi

if [ "$1" = "test" ]
then
    echo "MWDB_DISABLE_HOOKS=1" >> mwdb-vars.env
    echo "ENABLE_RATE_LIMIT=0" >> mwdb-vars.env
else
    echo "ENABLE_RATE_LIMIT=1" >> mwdb-vars.env
    echo "ENABLE_REGISTRATION=0" >> mwdb-vars.env
fi

echo "POSTGRES_USER=mwdb" > postgres-vars.env
echo "POSTGRES_DB=mwdb" >> postgres-vars.env
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> postgres-vars.env
