Setup and configuration
=======================

Prerequisites
-----------

MWDB was tested on Debian-based systems, but should work as well on other Linux distributions.

For production environments, you need to install:


* **PostgreSQL database** (https://www.postgresql.org/download/linux/debian/)
* **python-ssdeep library dependencies for Python 3** (https://python-ssdeep.readthedocs.io/en/latest/installation.html#id9) 

Optionally you can install:


* **Docker engine and Docker-Compose** if you want to use the Docker-based setup (https://docs.docker.com/engine/install/)
* **Redis database** needed by extra features like rate-limiting (https://redis.io/topics/quickstart)

It's highly recommended to create a fresh `virtualenv <https://docs.python.org/3/library/venv.html#module-venv>`_ for local MWDB installation:

.. code-block:: console

   # Create virtual environment
   ~/mwdb$ python3 -m venv venv

   # Activate virtual environment
   ~/mwdb$ ./venv/bin/activate

   (venv) ~/mwdb$

.. note::
   If you are a bit overwhelmed by setting up PostgreSQL database and you are looking for quick setup method just for testing: first make sure you have Docker and Docker-Compose installed and go to the `Alternative setup using Docker-Compose <#Alternative-setup-using-Docker-Compose>`_.

   You can also setup temporary PostgreSQL database container using Docker image:

   .. code-block:: console

      $ docker run -d --name mwdb-postgres -e POSTGRES_DB=mwdb -e POSTGRES_USER=mwdb -e POSTGRES_PASSWORD=mwdb -p 127.0.0.1:54322:5432 postgres

   The connection string is: ``postgresql://mwdb:mwdb@127.0.0.1:54322/mwdb``

Installation & Configuration
----------------------------

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

.. warning::

   Remember to run ``mwdb-core configure`` after each version upgrade to apply database migrations


Alternative setup using Docker Compose
--------------------------------------

The quickest way setup MWDB is to just clone the repository and use Docker-Compose. We recommend this method **only for testing** because it can be a bit more difficult to install extensions and integrate with other services.

.. code-block:: console

    $ git clone https://github.com/CERT-Polska/mwdb-core.git

After cloning repository, the first step is to go to the ``mwdb-core`` directory and generate configuration using ``./gen_vars.sh`` script.

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

Web application settings:


* ``serve_web`` (0 or 1) - By default, web application is served by mwdb-core application (\ ``1``\ ). If you want mwdb-core to serve only API and host web application by yourself (e.g. using nginx), you can turn off serving static files by setting this option to ``0``.
* ``web_folder`` (string) - Path to web application static files. By default, web application files are served from pre-compiled bundle embedded to Python package. If you want to use plugins that are incorporating additional frontend features, you need to rebuild the web application and serve them from your own path.

Plugin settings:


* ``enable_plugins`` (0 or 1) - If you want to turn off all plugins, set this option to ``0``. Default is ``1``.
* ``plugins`` (list of strings, separated by commas) - List of installed plugin module names to be loaded, separated by commas
* ``local_plugins_folder`` (string) - Directory that will be added to ``sys.path`` for plugin imports. Useful if you want to import local plugins that are not redistributable packages.
* ``local_plugins_autodiscover`` (0 or 1) - Autodiscover plugins contained in ``local_plugins_folder`` so you don't need to list them all manually in ``plugins``. Default is ``0``.

Extra features:


* ``enable_rate_limit`` (0 or 1) - Turns on rate limiting. Requires Redis database and ``redis_uri`` to be set. Default is ``0``.
* ``enable_registration`` (0 or 1) - Turns on user registration features. Requires additional configuration. Default is ``0``.
* ``enable_maintenance`` (0 or 1) - Turns on maintenance mode, making MWDB unavailable for users other than ``admin``. Default is ``0``.
* ``enable_json_logger`` (0 or 1) - Enables JSON logging which may be more convenient for automated log processing. Default is ``0``.
* ``redis_uri`` (string) - Redis database connection string, required by rate limiter.

Registration feature settings:


* ``mail_smtp`` (string) - SMTP connection string (\ ``host:port``\ )
* ``mail_from`` (string) - ``From`` field value used in e-mails sent by MWDB
* ``mail_templates_folder`` (string) - Path to the directory containing custom mail templates
* ``recaptcha_site_key`` (string) - ReCAPTCHA site key. If not set - ReCAPTCHA won't be required for registration.
* ``recaptcha_secret`` (string) - ReCAPTCHA secret key. If not set - ReCAPTCHA won't be required for registration.
