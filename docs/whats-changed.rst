What's changed?
===============

This page describes the most significant changes in the following versions, that may be interesting especially for
integration and plugin developers. We usually don't break API compatibility within major version, but plugins may
have compatibility problems after minor mwdb-core upgrade.

For upgrade instructions, see :ref:`Upgrade mwdb-core to latest version`.

v2.3.0
------

.. warning::

    This is Release Candidate. Some features may work slightly different in stable release.

    If something is missing here, feel free to report it by `creating a new issue <https://github.com/CERT-Polska/mwdb-core/issues/new?assignees=&labels=&template=feature_request.md>`_

This release is focused mainly on MWDB administration improvements and further UI refactoring. 
In addiition, Karton integration is now available out-of-the-box, without need of extra plugins.

[New feature] Built-in Karton integration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Karton integration is now included as a built-in part of MWDB Core. In addition, MWDB-Core 2.3.0 includes automatic migration spawned on ``mwdb-core configure`` for ``mwdb-plugin-karton`` users.

If you use ``mwdb-plugin-karton`` in your setup: remove the plugin before upgrade. For more instructions, read :ref:`Karton integration guide`.

[New feature] ``registered`` group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Before v2.3.0, it was difficult to setup guest accounts. To implement that, we added new capabilities:

- ``adding_files`` which is required for file upload
- ``manage_profile`` which is required for changes in user authentication (API keys, reset password)
- ``personalize`` that enables personalization features like Favorites or Quick queries.

But it was still painful to manage having only ``public`` group, which defines capabilities for all users in MWDB. That's why we created
new predefined group called ``registered``. Within migration, all capabilities are moved to ``registered`` group (with new one enabled)
and all existing users are added to that group.

``registered`` group behavior is similar to ``public``: new users are added by default and don't see each other within the group.
The only difference is that ``registered`` group is mutable, so any user can be easily removed from ``registered``.

By removing ``registered`` membership, you can make guest account with disabled file upload and personalization features!

If you don't like the split between ``public`` and ``registered`` in your instance, you can just remove the ``registered`` group and 
manually recover capabilities settings in ``public``.

[API] Plugin information is no longer available for non-admin users
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Plugin information was moved from ``/api/server`` endpoint to ``/api/server/admin``. Information was also moved from ``/about`` to the new ``/settings`` view in UI.

In addition ``/api/docs`` also requires authentication.

[API] Removed ``managing_attributes`` capability
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``managing_attributes`` behavior was inconsistent, because ``manage_users`` was still required e.g. to set up permissions for attribute key. From now, ``manage_users`` is required for
all administration tasks, including setting up new attribute keys.

v2.2.0
------

In 2.2.0 frontend part was heavily refactored, so some Web plugins may stop working properly without proper upgrade.

Follow the sections below to learn about the most important changes.

[New feature] Remote API feature
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

There is new feature that allows to connect directly to the other MWDB Core instance (e.g. mwdb.cert.pl).
This allows us to pull or push objects and discover new objects in the remote repository. At the time of release, feature is considered **beta** so
don't rely too much on it. If you want to test it, we'll be glad for feedback!

Read :ref:`Remote instances guide` to learn more.

[API] New file download endpoint
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Requests to MWDB API are mostly authenticated via Authorization header (instead of Cookie which is managed by browser),
so there is no easy way to let a browser download a file. That's why download process looked like below:

1.  ``POST /request/sample/{identifier}`` is used to get partial download URL with generated token
2.  ``GET /api/download/{access_token}`` is used to download the actual file

So we had always two HTTP requests to download the file contents. That's why in 2.2.0 you can download a file without
intermediate token via new ``/file/{identifier}/download`` endpoint.

* ``GET /file/<identifier>/download`` returns file contents for ``Authorization: Bearer`` requests
* ``GET /file/<identifier>/download?token=<token>`` for download token authorization that doesn't require Authorization header.
* ``POST /file/<identifier>/download`` that generates download token.

Old endpoints are considered obsolete and may be removed in further major release.

[Backend] Typed-Config is no longer embedded in mwdb package
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``typedconfig`` is no longer embedded in ``mwdb.core`` package, because it's used as external dependency.

For plugin compatibility, change

.. code-block:: python

    from mwdb.core.typedconfig import ...

to

.. code-block:: python

    from typedconfig import ...

[Web] React Context is used instead of Redux
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

That's the most breaking change, because we no longer use React-Redux for handling the global state.
Instead we use bunch of React Context providers that are available also for plugins.

So if you use code presented below to check if current user has required capability:

.. code-block:: jsx

    import {connect} from 'react-redux';

    ...

    function mapStateToProps(state, ownProps)
    {
        return {
            ...ownProps,
            isKartonManager: state.auth.loggedUser.capabilities.includes("karton_manage"),
        }
    }

    export default connect(mapStateToProps)(KartonAttributeRenderer);

rewrite it like below:

.. code-block:: jsx

    import React, { useContext } from 'react';
    import { AuthContext } from "@mwdb-web/commons/auth";

    export default function KartonAttributeRenderer(props) {
        const auth = useContext(AuthContext);
        const isKartonManager = auth.hasCapability("karton_manage");

        ...
    }

Learn more about React Context in `React documentation <https://reactjs.org/docs/context.html>`_.

[Web] Extra routes must be passed as instantiated components
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This is specific for `Switch component from React-Router <https://reactrouter.com/web/api/Switch>`_. Component must
be instantiated when passed as a children of Switch, instead it doesn't work correctly.

It worked before 2.2.0 because default route wasn't handled. From 2.2.0 incorrectly defined routes will be unreachable.

Instead of:

.. code-block:: jsx

    export default {
        routes: [
            (props) => (
                <ProtectedRoute
                    condition={
                        props.isAuthenticated &&
                        props.capabilities &&
                        props.capabilities.includes("mquery_access")
                    }
                    exact
                    path="/mquery"
                    component={MQuerySearchView}
                />
            )
        ]
    }

use:

.. code-block:: jsx

    function MQueryRoute(props) {
        const auth = useContext(AuthContext);
        return (
            <ProtectedRoute
                condition={auth.hasCapability("mquery_access")}
                {...props}
            />
        )
    }

    export default {
        routes: [
            <MQueryRoute exact path="/mquery"  component={MQuerySearchView}/>,
        ],
    }

[Web] `props.object` may be undefined for ShowObject extensions. Use ObjectContext instead
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

ShowObject components use ObjectContext natively which may affect some plugins that extend parts of this view

Instead of

.. code-block:: jsx

    export function MTrackerStatusBanner(props) {
        const objectType = props.object.type;
        const objectId = props.object.id;

        ...
    }

    export default {
        showObjectPresenterBefore: [MTrackerStatusBanner],

use

.. code-block:: jsx

    import React, { useContext } from "react";

    import { ObjectContext } from "@mwdb-web/commons/context";

    export function MTrackerStatusBanner(props) {
        const objectState = useContext(ObjectContext);
        const objectType = objectState.object.type;
        const objectId = objectState.object.id;

        ...
    }

    export default {
        showObjectPresenterBefore: [MTrackerStatusBanner],
