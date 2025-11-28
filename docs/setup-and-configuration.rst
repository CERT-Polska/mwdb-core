Setup and configuration
=======================

Installation and configuration with Docker Compose
--------------------------------------------------

The quickest way setup MWDB is to just clone the repository and use Docker-Compose with all batteries included.

.. code-block:: console

    $ git clone https://github.com/CERT-Polska/mwdb-core.git

After cloning repository, the first step is to go to the ``mwdb-core`` directory and generate configuration using ``./gen_vars.sh`` script.
Generated variables can be found in mwdb-vars.env.

.. code-block:: console

   $ ./gen_vars.sh 
   Credentials for initial mwdb account:

   -----------------------------------------
   Admin login: admin
   Admin password: la/Z7MsmKA3UxW8Psrk1Opap
   -----------------------------------------

   Please be aware that initial account will be only set up on the first run. If you already have a database with at least one user, then this setting will be ignored for security reasons. You can always create an admin account manually by executing a command. See "flask create_admin --help" for reference.

Then build images via ``docker-compose build`` and run MWDB via ``docker-compose up -d``.

Your MWDB instance will be available on default HTTP port (80): http://127.0.0.1/

If you want to use Docker Compose for MWDB development, check out :ref:`Developer guide`.

Standalone installation
-----------------------

Step 1.: Prerequisites
~~~~~~~~~~~~~~~~~~~~~~

MWDB was tested on Debian-based systems, but should work as well on other Linux distributions.

For production environments, you need to install:

* **PostgreSQL database** (minimum supported version: 12, https://www.postgresql.org/download/linux/debian/)
* libfuzzy2 for ssdeep evaluation
* other native dependencies listed below

.. code-block:: console

    $ apt install gcc libfuzzy-dev python3-dev python3-venv postgresql-client postgresql-common

Optionally you can install:

* **Docker engine and Docker-Compose** if you want to use the Docker-based setup (https://docs.docker.com/engine/install/)
* **Redis database** needed by extra features like rate-limiting (https://redis.io/topics/quickstart)

It's highly recommended to create a fresh `virtualenv <https://docs.python.org/3/library/venv.html#module-venv>`_ for local MWDB installation:

.. code-block:: console

   # Create virtual environment
   ~/mwdb$ python3 -m venv venv

   # Activate virtual environment
   ~/mwdb$ source ./venv/bin/activate

   (venv) ~/mwdb$

.. note::
   If you are a bit overwhelmed by setting up PostgreSQL database and you are looking for quick setup method just for testing: first make sure you have Docker and Docker-Compose installed and go to the `Alternative setup with Docker-Compose <#Alternative-setup-with-Docker-Compose>`_.

   You can also setup temporary PostgreSQL database container using Docker image:

   .. code-block:: console

      $ docker run -d --name mwdb-postgres -e POSTGRES_DB=mwdb -e POSTGRES_USER=mwdb -e POSTGRES_PASSWORD=mwdb -p 127.0.0.1:54322:5432 postgres

   The connection string is: ``postgresql://mwdb:mwdb@127.0.0.1:54322/mwdb``

Step 2.: Installation and configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The recommended installation method is pip:

.. code-block:: console

   $ pip install mwdb-core

After installing ``mwdb-core`` package, let's start with ``mwdb-core`` command:

.. code-block:: console

   $ mwdb-core

   [!] Wrong MWDB configuration.

   Use 'mwdb-core configure' to setup your MWDB instance.

   Usage: mwdb-core [OPTIONS] COMMAND [ARGS]...

     MWDB malware database

   Options:
     --help  Show this message and exit.

   Commands:
     configure  Configure MWDB instance
     db         Perform database migrations.
     routes     Show the routes for the app.
     run        Run a development server.
     shell      Run a shell in the app context.

Then, use ``mwdb-core configure`` to provide first configuration for your MWDB server.

.. code-block:: console

   $ mwdb-core configure

   Where do you want to place MWDB local files?

   1) Global directories (/var/lib/mwdb, /etc/mwdb)
   2) Local user directory (/home/steve/.mwdb)
   3) Current directory
   : 3

For first installation we recommend to install everything in current folder via ``3`` option. If you want to install MWDB system-wide or locally for user: choose ``1`` or ``2``.

Then, input the connection string for PostgreSQL database. The database must be online and reachable at the time of configuration. After that, you will be asked for path for uploads and instance base URL. If the default value is ok, press Enter:

.. code-block::

   PostgreSQL database connection string [postgresql://localhost/mwdb]:
   Uploads storage path [./uploads]:
   Base public URL of Malwarecage service [http://127.0.0.1]:

Depending on the installation type, your configuration will be stored in ``mwdb.ini`` file and can be changed any time you want:

.. code-block::

   [+] Configuration stored in ./mwdb.ini file!

After storing the configuration, the ``configure`` command will initialize database schema:

.. code-block::

   [+] Configuration already initialized... skipping
   INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
   INFO  [alembic.runtime.migration] Will assume transactional DDL.
   INFO  [alembic.runtime.migration] Running upgrade  -> 2e692ea445a1, Initial version
   ...
   Provide password for Malwarecage 'admin' account:
   Repeat password:

Finally, you will be asked asked for the admin account password that will be used as the management account.

.. code-block::

   MWDB configured successfully!

   Use 'mwdb-core run' to run the server.

And you are done! ``run`` command will start the Flask server:

.. code-block:: console

   $ mwdb-core run
    * Environment: production
      WARNING: This is a development server. Do not use it in a production deployment.
      Use a production WSGI server instead.
    * Debug mode: off
    * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)

Your MWDB instance will be available on port 5000 (use ``--port`` to change that): http://127.0.0.1:5000/

Keep in mind that Flask server is meant to be used as development server and **is not suitable for production**.
See also: https://flask.palletsprojects.com/en/2.2.x/server/

.. warning::

   In standalone setup, remember to run ``mwdb-core configure`` after each version upgrade to apply database migrations.

Step 3.: Setting up gunicorn and nginx
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

It's recommended to deploy Flask applications using dedicated WSGI server. We highly recommend Gunicorn as it's used
in our Docker images and combine it with Nginx serving as proxy server for best security and performance

.. seealso::

    https://flask.palletsprojects.com/en/2.2.x/deploying/gunicorn/

    https://docs.gunicorn.org/en/latest/deploy.html#deploying-gunicorn

Proper configuration files and templates used in our Docker images can be found in `docker directory on our Github repository
<https://github.com/CERT-Polska/mwdb-core/tree/master/docker>`_

Upgrading mwdb-core to latest version
-------------------------------------

For standalone installation (pip-based), upgrade mwdb-core package to the latest version.

.. code-block:: console

   $ pip install -U mwdb-core

Then apply required database migrations using ``mwdb-core configure``.

.. code-block:: console

   $ mwdb-core configure

If you use Docker-based environment, just pull the latest changes from repository and rebuild the images. Database migrations will be applied as a part of container startup.

Storing files in S3 Compatible storage (MinIO, AWS S3)
----------------------------------------------------------

.. versionadded:: 2.1.0

By default, all files uploaded to mwdb-core are stored in the local file system (under path provided in ``uploads_folder`` configuration key).
It's the most universal and simplest way, but not sufficient if our scale requires distributed storage or cloud-based infrastructure.
In that case we can use solutions like `MinIO <https://min.io/>`_ or another S3-compatible object-based storage.

If you want to store files using object storage, open the ``mwdb.ini`` file and set the following keys:

.. code-block::

    storage_provider = s3
    hash_pathing = 0
    s3_storage_endpoint = <storage endpoint>
    s3_storage_access_key = <storage access key>
    s3_storage_secret_key = <storage secret key>
    s3_storage_bucket_name = <storage bucket name>

    # optional (for AWS S3)
    s3_storage_region_name = <AWS S3 region name>
    # optional (for TLS)
    s3_storage_secure = 1
    # optional (for AWS IAM role authentication)
    s3_storage_iam_auth = 1

.. note::

   If you are using MinIO, it's recommended to set hash_pathing to 1. Although MinIO is an object storage, it uses prefixes
   to organize files like in traditional, hierarchical file systems. Read more in
   `MinIO Core Administration Concepts documentation <https://min.io/docs/minio/linux/administration/concepts.html>`_.

   If you want to migrate from one naming scheme to another, MWDB Core v2.15.0 introduces hash_pathing_fallback option to
   try both schemes while reading files from storage.

If you use Docker-based setup, all the configuration can be set using environment variables (e.g. ``MWDB_STORAGE_PROVIDER=s3``).

.. note::

   If you are using ``karton``, we highly recommend creating a separate bucket for it.
   Failing to do so might result in data loss caused by ``karton's`` garbage collector.

Setting higher upload size limit in Docker
------------------------------------------

mwdb-core allows to set maximum upload size via ``max_upload_size`` parameter in configuration (see also :ref:`Advanced configuration` section).

mwdb-core package doesn't enforce any limitation by default, but if you use Docker images: nginx configuration in mwdb-web image have set 50M limit
using `client_max_body_size <http://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size>`_ option. If you want to set different
limitation for Docker environment, use ``NGINX_MAX_UPLOAD_SIZE`` environment variable to set ``client_max_body_size`` option.

If you want to customize other nginx settings (e.g. timeouts), you can also provide your own ``nginx.conf.template`` by building your own image
based on ``certpl/mwdb-web``. More information can be found in `#927 issue discussion on Github <https://github.com/CERT-Polska/mwdb-core/issues/927>`_.

Advanced configuration
----------------------

mwdb-core can be configured using several methods. Configuration is read from the following sources, ordered by priority:


* Environment variables (\ ``MWDB_xxx``\ )
* ``./mwdb.ini`` configuration file in current directory
* ``~/.mwdb-core/mwdb.ini`` in home directory
* ``/etc/mwdb-core/mwdb.ini`` as global configuration

Sources are overriding each other depending on the priority, which means that environment value ``MWDB_ENABLE_PLUGINS=0`` will override the ``enable_plugins = 1`` entry in ``mwdb.ini`` file.

The format for environment variable is ``<SECTION>_<KEY>`` uppercase. The default section for all mwdb-core settings is ``mwdb``. Plugins can also be configured by ``mwdb.ini`` file using their own sections. Check appropriate section name in plugin's documentation.

Basic settings:


* ``postgres_uri`` (string, required) - PostgreSQL database connection string
* ``secret_key`` (string, required) - Secret key used by Flask application and to sign authentication tokens. Change of that value will invalidate all sessions and all registered API keys.
* ``uploads_folder`` (string, required) - Path where MWDB stores uploaded files
* ``base_url`` (string) - Base URL of MWDB web application, used for registration mail templates. Default is ``http://127.0.0.1``
* ``file_upload_timeout`` (integer) - File upload process will be terminated if it takes more than this parameter value in milliseconds. Default value is 60000 ms.
* ``statement_timeout`` (integer) - Database statement_timeout parameter. Database server aborts any statement that takes more than the specified number of milliseconds.
* ``request_timeout`` (integer) - HTTP request will be terminated if it takes more than this parameter value in milliseconds. Default value is 20000 ms.
* ``instance_name`` - (string) - custom name for local MWDB instance. Default value is "mwdb".


Web application settings:


* ``serve_web`` (0 or 1) - By default, web application is served by mwdb-core application (\ ``1``\ ). If you want mwdb-core to serve only API and host web application by yourself (e.g. using nginx), you can turn off serving static files by setting this option to ``0``.
* ``web_folder`` (string) - Path to web application static files. By default, web application files are served from pre-compiled bundle embedded to Python package. If you want to use plugins that are incorporating additional frontend features, you need to rebuild the web application and serve them from your own path.
* ``flask_config_file`` (string) - additional file containing Flask configuration (.py)
* ``admin_login`` (string) - administrator account name
* ``admin_password`` (string) - initial password for administrator account
* ``use_x_forwarded_for`` (0 or 1) - Set this to 1 if MWDB backend is behind reverse proxy, so X-Forwarded-For header is correctly translated to ``request.remote_addr`` value. Set by default to 1 in ``certpl/mwdb`` Docker image.


Plugin settings:


* ``enable_plugins`` (0 or 1) - If you want to turn off all plugins, set this option to ``0``. Default is ``1``.
* ``plugins`` (list of strings, separated by commas) - List of installed plugin module names to be loaded, separated by commas
* ``local_plugins_folder`` (string) - Directory that will be added to ``sys.path`` for plugin imports. Useful if you want to import local plugins that are not redistributable packages.
* ``local_plugins_autodiscover`` (0 or 1) - Autodiscover plugins contained in ``local_plugins_folder`` so you don't need to list them all manually in ``plugins``. Default is ``0``.

Storage settings:


* ``max_upload_size`` (integer) - Maximum upload size in bytes. Keep in mind that this value refers to whole upload request (``Content-Length`` from request header), so the maximum file size is smaller than that by +/- 500B (because of additional payload with metadata). Default is ``None``, which means there is no limit.
* ``storage_provider`` (disk or s3) - If you want to use S3-compatible object storage instead of local file system, set this option to ``s3``. Default is ``disk``.
* ``hash_pathing`` (0 or 1) - Should we break up the uploads into different folders. If you use S3-compatible storage other than MinIO, recommended option is ``0`` (default: ``1``).
* ``hash_pathing_fallback`` (0 or 1) - If set to 1, MWDB will try to reach a file contents for reading using both naming schemes (with and without hash_pathing). It's useful during migration from one scheme to another. Default is ``0``.
* ``s3_storage_endpoint`` (string) - S3 API endpoint for object storage. Required if you use S3-compatible storage.
* ``s3_storage_access_key`` (string) - S3 API access key for object storage. Required if you use S3-compatible storage.
* ``s3_storage_secret_key`` (string) - S3 API secret key for object storage. Required if you use S3-compatible storage.
* ``s3_storage_bucket_name`` (string) - S3 API bucket name for object storage. Required if you use S3-compatible storage.
* ``s3_storage_region_name`` (string, optional) - S3 API storage region name. Used mainly with AWS S3 storage (default is None).
* ``s3_storage_secure`` (0 or 1) - Use TLS for S3 API connection (default is ``0``).
* ``s3_storage_iam_auth`` (0 or 1) - Use AWS IAM role for S3 authentication (default is ``0``). If ``1``, then ``s3_storage_access_key`` and ``s3_storage_secret_key`` aren't required.

Extra features:


* ``enable_rate_limit`` (0 or 1) - Turns on rate limiting. Requires Redis database and ``redis_uri`` to be set. Default is ``0``.
* ``enable_registration`` (0 or 1) - Turns on user registration features. Requires additional configuration. Default is ``0``.
* ``enable_password_auth`` (0 or 1) - Enables password-based authentication. You may disable it if you want to authenticate only via OpenID Connect. Default is ``1``.
* ``enable_maintenance`` (0 or 1) - Turns on maintenance mode, making MWDB unavailable for users other than ``admin``. Default is ``0``.
* ``enable_json_logger`` (0 or 1) - Enables JSON logging which may be more convenient for automated log processing. Default is ``0``.
* ``enable_prometheus_metrics`` (0 or 1) - Enables Prometheus metrics (\ ``/api/varz`` endpoint\ )
* ``enable_debug_log`` (0 or 1) - Enables debug logging
* ``redis_uri`` (string) - Redis database connection string, required by rate limiter.
* ``remotes`` (comma separated strings) - list of MWDB remotes (experimental)
* ``enable_hooks`` (0 or 1) - enable plugin hooks
* ``enable_oidc`` (0 or 1) - enable OIDC (experimental)
* ``listing_endpoints_count_limit`` (integer) - Limits number of objects returned by listing endpoints. Default is ``1000``.
* ``log_level`` (string) - logging threshold for MWDB logger (e.g. WARNING, see also `Python logging levels <https://docs.python.org/3/library/logging.html#logging-levels>`_)
* ``log_config_file`` (string) - Python logging configuration file (see also `logging.config configuration file format <https://docs.python.org/3/library/logging.config.html#logging-config-fileformat>`_)


Registration feature settings:


* ``mail_smtp`` (string) - SMTP connection string (\ ``host:port``\ )
* ``mail_from`` (string) - ``From`` field value used in e-mails sent by MWDB
* ``mail_username`` (string) - SMTP user name
* ``mail_password`` (string) - SMTP user password
* ``mail_tls`` (0 or 1) - Enable STARTTLS
* ``mail_templates_folder`` (string) - Path to the directory containing custom mail templates
* ``recaptcha_site_key`` (string) - ReCAPTCHA site key. If not set - ReCAPTCHA won't be required for registration.
* ``recaptcha_secret`` (string) - ReCAPTCHA secret key. If not set - ReCAPTCHA won't be required for registration.

Using MWDB in Kubernetes environment
------------------------------------

Here are examples of YAML specifications for k8s deployments:

.. code-block:: yaml

    apiVersion: apps/v1
    kind: Deployment
    metadata:
        name: mwdb
        namespace: mwdb-prod
    spec:
        replicas: 1
        selector:
            matchLabels:
                app: mwdb
        template:
            metadata:
                labels:
                    app: mwdb
            spec:
                initContainers:
                    # Init container that performs database migration on upgrade
                    - env:
                        # Provide secrets and first configuration admin password via environment vars
                        - name: MWDB_SECRET_KEY
                          valueFrom:
                            secretKeyRef:
                            key: key
                            name: secret-mwdb-secret-key
                        - name: MWDB_POSTGRES_URI
                          valueFrom:
                            secretKeyRef:
                            key: uri
                            name: secret-mwdb-database-uri
                        - name: MWDB_ADMIN_PASSWORD
                          valueFrom:
                            secretKeyRef:
                            key: password
                            name: secret-mwdb-admin-password
                        - name: MWDB_BASE_URL
                          value: https://mwdb.cert.pl
                      image: certpl/mwdb:v2.9.0
                      imagePullPolicy: Always
                      name: mwdb-migration-container
                      command: [ 'sh', '-c', '/app/venv/bin/mwdb-core configure -q' ]
                containers:
                    - env:
                        - name: GUNICORN_WORKERS
                          - name: MWDB_SECRET_KEY
                          valueFrom:
                            secretKeyRef:
                            key: key
                            name: secret-mwdb-secret-key
                        - name: MWDB_POSTGRES_URI
                          valueFrom:
                            secretKeyRef:
                            key: uri
                            name: secret-mwdb-database-uri-key
                        - name: MWDB_BASE_URL
                          value: https://mwdb.cert.pl
                        - name: MWDB_ENABLE_KARTON
                          value: '1'
                        - name: MWDB_S3_STORAGE_ENDPOINT
                          value: s3.cert.pl
                          # ... more configuration
                      image: certpl/mwdb:v2.9.0
                      imagePullPolicy: Always
                      livenessProbe:
                        httpGet:
                            path: /api/ping
                            port: 8080
                      readinessProbe:
                        httpGet:
                            path: /api/ping
                            port: 8080
                      name: mwdb-container
                      volumeMounts:
                        - mountPath: /etc/karton/karton.ini
                          name: karton-config-volume
                          subPath: config.ini
                volumes:
                  - name: karton-config-volume
                    secret:
                      defaultMode: 420
                      items:
                      - key: config-file
                        path: config.ini
                      secretName: karton-config


.. code-block:: yaml

    apiVersion: apps/v1
    kind: Deployment
    metadata:
        name: mwdb-web
        namespace: mwdb-prod
    spec:
        replicas: 1
        selector:
            matchLabels:
                app: mwdb-web
        template:
            metadata:
                labels:
                    app: mwdb-web
            spec:
                containers:
                - env:
                    # Provide internal URI to backend service for nginx reverse proxy
                    - name: PROXY_BACKEND_URL
                    value: http://mwdb-service:8080/
                  image: certpl/mwdb-web:v2.9.0
                  livenessProbe:
                      httpGet:
                        path: /
                        port: 80
                  name: mwdb-web-container
                  readinessProbe:
                    httpGet:
                        path: /
                        port: 80
