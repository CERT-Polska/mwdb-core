Integration guide
=================

MWDB comes with advanced plugin engine, which allows to add new API features, integrate MWDB with other systems using webhooks and extend MWDB UI functionality.

Plugins are used by mwdb.cert.pl to:

- integrate MWDB with malware analysis backend and reporting systems
- provide new features like mquery search
- customize mwdb.cert.pl instance

.. note::

    This chapter describes only the most basic features of plugin system, allowing to write simple integrations. More plugin system features will be documented in the near future.

Getting started with local plugins
----------------------------------

Backend plugins are just Python packages imported by MWDB from specified location. Let's check the plugin settings in `mwdb.ini`:

.. code-block::

    ### Plugin settings

    # Set enable_plugins to 0 to turn off plugins (default: 1)
    # enable_plugins = 0

    # List of plugin module names to be loaded, separated by commas
    # plugins = 

    # Directory that will be added to sys.path for plugin imports
    # Allows to load local plugins without installing them in site-packages
    # local_plugins_folder = ./plugins

    # Autodiscover plugins contained in local_plugins_folder (default: 0)
    # local_plugins_autodiscover = 1

Plugins can be loaded from installed packages or imported from ``local_plugins_folder``. 

Let's create a simple, local ``hello_world`` plugin:

.. code-block::

    plugins
    └── hello_world
        └── __init__.py

and put short description in ``__init__.py`` file:

.. code-block:: python
 
    __author__ = "just me"
    __version__ = "1.0.0"
    __doc__ = "Simple hello world plugin"

Then, set ``mwdb.ini`` file to load your ``hello_world`` plugin. If you configured mwdb-core to use current directory, you should find that file there. If not, you can still overwrite the ``mwdb.ini`` settings by creating another ``mwdb.ini`` file in the current working directory, where ``mwdb-core run`` is invoked.

.. code-block::

    [mwdb]
    ...

    plugins = hello_world
    local_plugins_folder = ./plugins

Let's run the mwdb-core:

.. code-block:: console

    $ mwdb-core run
    * Environment: production
    WARNING: This is a development server. Do not use it in a production deployment.
    Use a production WSGI server instead.
    * Debug mode: off
    [INFO] MainThread - plugins.load_plugins:141 - Loaded plugin 'hello_world'
    * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)

As you can see in logs, your plugin has been loaded successfully. You can additionally check that using ``/about`` endpoint in UI.

.. image:: ./_static/hello-world-plugin.png
   :target: ./_static/hello-world-plugin.png
   :alt: Hello world plugin visible in About

Adding webhook
--------------

Now, let's make it a bit more useful and add the actual webhook. When plugin module is loaded by MWDB, it calls the entrypoint function named ``__plugin_entrypoint__``.

Modify the ``__init__.py`` file to implement simple entrypoint saying "Hello world!".

.. code-block:: python

    import logging

    from mwdb.core.plugins import PluginAppContext

    __author__ = "just me"
    __version__ = "1.0.0"
    __doc__ = "Simple hello world plugin"


    logger = logging.getLogger("mwdb.plugin.hello_world")


    def entrypoint(app_context: PluginAppContext):
        logger.info("Hello world!")


    __plugin_entrypoint__ = entrypoint

The expected result is:

.. code-block:: console

    $ mwdb-core run
    * Environment: production
    WARNING: This is a development server. Do not use it in a production deployment.
    Use a production WSGI server instead.
    * Debug mode: off
    [INFO] MainThread - __init__.entrypoint:14 - Hello world!
    [INFO] MainThread - plugins.load_plugins:141 - Loaded plugin 'hello_world'
    * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)

``PluginAppContext`` object allows to provide extension for MWDB like adding webhook handler and extending the API.

Webhook handler is implemented by providing a new class that inherits from ``PluginHookHandler``. New handler class can be then registered using ``app_context.register_hook_handler`` method.

.. code-block:: python

    import logging

    from mwdb.core.plugins import PluginAppContext, PluginHookHandler
    from mwdb.model import File

    __author__ = "just me"
    __version__ = "1.0.0"
    __doc__ = "Simple hello world plugin"


    logger = logging.getLogger("mwdb.plugin.hello_world")


    class HelloHookHandler(PluginHookHandler):
        def on_created_file(self, file: File):
            logger.info("Nice to meet you %s", file.file_name)

        def on_reuploaded_file(self, file: File):
            logger.info("Hello again %s", file.file_name)


    def entrypoint(app_context: PluginAppContext):
        logger.info("Hello world!")
        app_context.register_hook_handler(HelloHookHandler)


    __plugin_entrypoint__ = entrypoint


After applying above modifications to ``__init__.py``, let's restart ``mwdb-core`` and add a new to file and check if it works.

.. code-block:: console

    [INFO] Thread-3 - __init__.on_created_file:16 - Nice to meet you evil.exe
    [INFO] Thread-3 - object.create_object:88 - File added - dhash:9e302844386835ef50bec3017e2c60705ab6bf33e4849e58e3af19a605b46d00 - is_new:True
    ...
    [INFO] Thread-12 - __init__.on_reuploaded_file:19 - Hello again evil.exe
    [INFO] Thread-12 - object.create_object:88 - File added - dhash:9e302844386835ef50bec3017e2c60705ab6bf33e4849e58e3af19a605b46d00 - is_new:False

Webhooks can be used to automatically analyze the uploaded file in sandbox. The good example is `mwdb-plugin-drakvuf <https://github.com/CERT-Polska/mwdb-plugin-drakvuf>`_ which implements webhook that sends all uploaded files to the `Drakvuf Sandbox <https://github.com/CERT-Polska/drakvuf-sandbox>`_ for analysis.

Check out `mwdb-plugin-drakvuf <https://github.com/CERT-Polska/mwdb-plugin-drakvuf>`_ on Github!

Available hooks
--------------
A lot of hooks have been implemented in MWDB. Each of these hooks is triggered when particular event accurs in system.


List of available hooks and events triggered these hooks.

* ``on_created_object(self, object: Object)``  - object was uploaded (file, blob or config) or pulled from remoted resource
* ``on_reuploaded_object(self, object: Object)``  - object was again uploaded or pulled from remote resource
* ``on_removed_object(self, object: Object)`` - object was deleted
* ``on_created_file(self, file: File)`` - file was uploaded or pulled from remoted resource
* ``on_reuploaded_file(self, file: File):`` - file was again uploaded or pulled from remote resource
* ``on_removed_file(self, file: File)`` - file was deleted
* ``on_created_config(self, config: Config)`` - config was uploaded or pulled from remoted resource
* ``on_reuploaded_config(self, config: Config)`` - config was again uploaded or pulled from remote resource
* ``on_removed_config(self, config: Config)`` - config was deleted
* ``on_created_text_blob(self, blob: TextBlob)`` - text blob was uploaded or pulled from remoted resource
* ``on_reuploaded_text_blob(self, blob: TextBlob)`` - text blob was again uploaded or pulled from remote resource
* ``on_removed_text_blob(self, blob: TextBlob)`` - text blob was deleted
* ``on_created_tag(self, object: Object, tag: Tag)`` - a new tag was created and assigned to object
* ``on_reuploaded_tag(self, object: Object, tag: Tag)`` - tag was again assigned to object
* ``on_removed_tag(self, object: Object, tag: Tag)`` - tag was removed from object
* ``on_created_comment(self, object: Object, comment: Comment)`` - a new comment was created and assigned to object
* ``on_removed_comment(self, object: Object, comment: Comment)`` - comment was removed from object
* ``on_created_relation(self, parent: Object, child: Object)`` - relation between parent and child objects was added
* ``on_removed_relation(self, parent: Object, child: Object)`` - relation between parent and child objects was removed
* ``on_created_attribute_key(self, attribute_def: AttributeDefinition)`` - attribute definition was created
* ``on_updated_attribute_key(self, attribute_def: AttributeDefinition)`` - attribute definition was updated
* ``on_removed_attribute_key(self, attribute_def: AttributeDefinition)`` - attribute definition was removed
* ``on_created_attribute(self, object: Object, attribute: Attribute)`` - attribute was assigned to object
* ``on_removed_attribute(self, object: Object, attribute: Attribute)`` - attribute was removed from object
* ``on_created_user(self, user: User)`` - a new user account was created
* ``on_removed_user(self, user: User)`` - user account was removed
* ``on_updated_user(self, user: User)`` - user account was updated
* ``on_created_group(self, group: Group)`` - a new group was created. Also when a new user is registered and his private group is created
* ``on_removed_group(self, group: Group)`` - group was removed. Also when a user is deleted and his private group is removed
* ``on_updated_group(self, group: Group)`` - group attributes where updated
* ``on_created_membership(self, group: Group, user: User)`` - user was added to the group
* ``on_removed_membership(self, group: Group, user: User)`` - user was removed from the group
* ``on_updated_membership(self, group: Group, user: User)`` - membership was updated
* ``on_changed_object(self, object: Object)`` - this hook is triggered when one of the undermentioned events takes place:

  * a new tag was created and assigned to object
  * tag was removed from object
  * a new comment was created and assigned to object
  * comment was removed from object
  * relation between parent and child objects was added
  * relation between parent and child objects was removed
  * attribute was assigned to object
  * attribute was removed from object