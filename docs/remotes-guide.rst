Remote instances guide
===============

Remote instance introduction
----------------------------------

Remote instances allow us to use external mwdb servers within our local instance.
This gives us the ability to view samples located in the remote instance, as well as pull data from the remote instance to the local instance and push to the remote.

Depending on the permissions we have on the remote instance, the following things are possible for us:

* viewing samples, configs and blobs
* pull action to retrieve an object from a remote instance
* performing a push action to push an object to the remote instance

Remote instance UI are currently limited to the main mwdb views.
Actions affecting the state of the object on a remote instance, such as commenting, adding tags or attributes, were also blocked.

Setting up remote instance
----------------------------------

In order to use the remote instance views, you need the api key associated with the account authorized within it.
If you don't have the api key generated or don't know how to do it, check :ref:`How to use API keys?` for more information.

With the api key generated already, navigate to the file ``mwdb.ini`` inside ``docker`` folder in main project directory.
In this file you should add the definition of the remote instance along with the api key and its url in the form:

.. code-block:: docker
    ...
    remotes = mwdb.cert.pl

    [remote:mwdb.cert.pl]
    url = http://mwdb.cert.pl
    api_key=ey...

The remotes variable inside this file passes the list of variables to the mwdb configuration files, from which we can browse remote instances within by the local application instance.
If we want to define more remote instances, just add more remots in the form

.. code-block:: docker

    [remote:<remote-name>]
    url = <remote-url>
    api_key=<remote-api-token>

and then add them to the variable remotes in ``mwdb.ini``

.. code-block:: docker

    remotes = remote-name1, remote-name2

This way we will have access to multiple instances by navigating through the local mwdb application.

.. warning::

   Note that the api key used to define the remote instance allows all users of the local instance to have remote user permissions.

By placing the server using the docker service, you will see options related to remote instances in the main view.

Remote instance features
----------------------------------
Going to the remote mwdb instance is done via the new dropdown in the right threshold of the navigation bar.
After clicking on it, a list of defined remotes will appear. Selecting a given instance will take you to its remote view.

.. image:: ../_static/remote-switch.png
   :target: ../_static/remote-switch.png
   :alt: navbar remote

To go back to the local mwdb, just click on the button ``Local instance`` or you can change the current remote instance by selecting a different one from the list under ``Switch to remote...``.

.. image:: ../_static/remote-view.png
   :target: ../_static/remote-view.png
   :alt: remote recent view

Remote instance view allows you to view shared with you samples, configs and blobs or getting to know the detailed information related to a specific object stored in the remote instance
At the moment, there are views depending on the object category and the search view.

.. warning::

    The quick query function has been limited because it would refer to the user who owns the api key in the defined remote instance.

By going to the view of a specific object on a remote instance, we will learn detailed information about this object and we will be able to perform two possible actions on it:

* ``Download`` to download the object from a remote instance
* ``Pull`` to load the object into the local mwdb database

The remaining actions that can be performed on the remote object have been limited.

.. image:: ../_static/remote-object-pull.png
   :target: ../_static/remote-object-pull.png
   :alt: remote object view pull

Another way to load an object from a remote instance to a local one is to go to a new view in the local mwdb `` Pull``.
Then select the instance from which you want to pull the object and enter its identifier.

.. image:: ../_static/remote-pull.png
   :target: ../_static/remote-pull.png
   :alt: local remote object view pull


Similar to the pull action on an object on a remote instance, we can also push an object from a local instance to a remote instance by clicking the appropriate ``push`` button in the local object view.

.. image:: ../_static/remote-push.png
   :target: ../_static/remote-push.png
   :alt: remote object view push

After clicking on the button, a window will appear in which you will have to select the remote instance to which you want to push the object.

.. image:: ../_static/remote-push-modal.png
   :target: ../_static/remote-push-modal.png
   :alt: remote object view push modal

.. warning::

    Please note that when pushing objects onto a remote instance, we perform this action as the user to whom the api key belongs.
    For this reason, the objects will be published under his login, provided that he has permission to upload the given type of object in the selected defined remote instance.

