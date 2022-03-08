OpenID Connect authentication (Single Sign-On)
==============================================

.. versionadded:: 2.6.0

MWDB starting from version 2.6.0 allows you to log in using an external identity provider.
The OpenID Connect protocol is used for this and it was integrated with the MWDB authentication system.

.. warning::

   The current implementation of this authentication method is still under development and should be considered to be beta feature.

To be able to use this method of logging in, you must configure MWDB with special environment variable: ``MWDB_ENABLE_OIDC=1``
or via ``mwdb.ini`` configuration field: ```enable_oidc = 1```

The easiest way to play with this functionality is to set up the environment with a ``docker-compose-oidc-dev.yml`` file
which sets the appropriate environment variable and sets up a test external `Keycloak server <https://www.keycloak.org/>`_

Automatic integration of MWDB with the test server is described in ``dev/oidc/README.md``.

OpenID Connect integration gives us the opportunity to perform new actions:

* identity provider registration
* logging in with an external identity provider
* register new user using external identity

Setting up new OpenID Provider
------------------------------

If you want to add a new OpenID Provider, go to ``Settings`` and click on ``OpenID Connect`` tab.

The required information is:

- ``name``
- ``client_id``
- ``client_secret`` (if symmetric key is used to sign the JWT e.g. HS256)
- ``authorization_endpoint``
- ``userinfo_endpoint``
- ``token_endpoint``
- ``jwks_endpoint`` (if asymmetric key is used to sign the JWT e.g. RS256)

OpenID client setup on OpenID Provider
--------------------------------------

During client registration, you may need information listed below (example for Keycloak):

- ``Standard Flow Enabled`` - MWDB-Core uses authorization code flow only
- Valid Redirect URLs: ``https://<mwdb core url>/oauth/callback``
- Minimal required scope: ``email, profile``


.. note::
    Using the OpenID Connect protocol requires the appropriate set  value `` base_url`` in configuration.
    This value is used for generating ``redirect_uri`` therefore it is essential for authentication in that way.

Current configuration is pretty minimal. In future versions it may be extended with ``roles`` for automatic
group/permission assignment or Single Logout parameters.

As feature is still during development, keep in mind that these parameters may change a bit in future versions.

Bind MWDB account with OpenID Provider
--------------------------------------

After successfully registering the correct information about the appropriate provider, you can try to authenticate with it.

To do this go to the ``Profile`` and click on the ``OpenID Connect`` section. There you can link your local account with an external identity.

Now to test authentication with external provider, please log out and go to the ``OAuth authenication`` tab where you can log in with OpenID Connect protocol.

.. note::
    It is also possible to create a new MWDB account by authorizing through external identity provider.

    For users who already have MWDB accounts it is recommended to bind the account with external identity in Profile section.
