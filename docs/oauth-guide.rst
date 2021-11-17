OAuth-based authentication
==============

.. versionadded:: 2.6.0

MWDB starting from version 2.6.0 allows you to log in using an external identity provider.
The OpenID Connect protocol was used for this and it was integrated with the MWDB authentication system.

.. warning::

   The current implementation of this authentication method is still under development and should be considered to be beta feature.

To be able to use this method of logging in, you must configure MWDB with special environment variable: ``MWDB_ENABLE_OIDC=1``.

The easiest way to test this functionality is to set up the environment with a ``docker-compose-oidc-dev.yml`` file
which sets the appropriate environment variable and sets up a test external keycloak server.

Automatic integration of MWDB with the test server is described in ``dev/oidc/README.md``.

However, setting a special environment variable ``MWDB_ENABLE_OIDC`` gives us the opportunity to perform new actions:

* identity provider registration
* logging in with an external identity provider
* register with an external identity provider

To log in with an external identity provider, you must first register the relevant information about it in the ``settings OpenID Connect`` tab.

The required information is:
        ``name``
        ``client_id``
        ``client_secret``
        ``authorization_endpoint``
        ``userinfo_endpoint``
        ``token_endpoint``
        ``jwks_endpoint``

.. warning::

    Remember that various servers require different information to perform the authorization therefore ``client_id`` and ``jwks_endpoint`` are not required during the registration process.

After successfully registering the correct information about the appropriate provider, you can try to authenticate with it.

To do this go to the ``profile OpenID Connect`` section. There you can link your local account with an external identity.

Now to test authentication with external provider, please log out and go to the ``OAuth authenication`` tab where you can log in with OpenID Connect protocol.

.. note::

    For users who have MWDB accounts it is recommended to bind the account with external identity in profile section.
    It is also possible to create a new MWDB account by authorizing through external identity provider.
    You should then choose the appropriate link in the OAuth authentication section.