6. Object attributes
====================

Attributes (formerly called "metakeys") are used to store associations with external systems and other extra information about object.

List of object attributes can be found in detailed object view in ``Attributes`` box.


.. image:: ../_static/lpbcHwS.png
   :target: ../_static/lpbcHwS.png
   :alt: 


How attributes can be used?
---------------------------

Attributes are set of unique key-value pairs, ordered from the earliest added. Keys are not arbitrary and must be defined first in attribute configuration. Each attribute key can have special properties depending on the key semantics. 

Attribute feature was initially designed to store the analysis identifier. Attribute values can be rendered as URLs, pointing to the external webpage with analysis details.


.. image:: ../_static/ntOcb7i.gif
   :target: ../_static/ntOcb7i.gif
   :alt: 


Plugins can apply custom rendering of attribute values to include additional information from external systems. Good example is Karton plugin that uses custom component to show information about analysis status.

Declaring new attribute
-----------------------

.. warning::

   **Be careful!** Attribute key can't be renamed nor deleted in current version of mwdb-core.


Attributes must be declared first by administrator (or any other user that ``Can define new attributes and manage them``\ ). To declare new attribute, go to the ``Admin`` → ``Manage attributes`` view using navigation bar.

Then, click on ``Define attribute`` button.


.. image:: ../_static/FnWYO8q.gif
   :target: ../_static/FnWYO8q.gif
   :alt: 


Attribute key has few basic properties described below:


* **Key** - the main attribute key name, identifying the key and used in API. Must contain only lowercase letters and digits and maximum 32 characters are allowed.
* **Label** (optional) - user-friendly label for attribute, visible for MWDB users instead of key. Can be changed any time you want.
* **Description** (optional) -  description to explain users the semantics of attribute, visible in MWDB UI.
* **URL template** (optional) - URL template used to map the values to the URLs. Template can contain ``$value`` placeholder, where MWDB UI will put the attribute value and make clickable link.
* **Hidden attribute** (optional) - Actually it should be called "protected attribute". These attributes have special purpose and are described further.

After defining new attribute, click ``Submit``. The most important thing at this step is to choose good attribute key. Don't worry much about the optional fields, they can be changed any time you want.

When attribute is added, you will be redirected to the attribute key settings page. It looks almost the same, but have additional box at the bottom with ACL (access control list) settings for groups.


.. image:: ../_static/hIogVZx.png
   :target: ../_static/hIogVZx.png
   :alt: 


Attributes without ACLs are accessible only for administrators or users with special capabilities like ``Has access to all attributes of object`` and ``Can add all attributes to object``. Regular users can't see and set attributes without explicit permission.

If you want to give permission to the specific group or use, type the group name (or user login) and click ``Add group``. Then, you can use ``Can read`` and ``Can set`` switches to set the permissions. Finally, apply changes for group using ``Update`` button.

If attribute should be available to all users in MWDB instance, add ``public`` group with ``Can read`` permission. If you want all users to add new values with defined attribute key - additionally enable ``Can set`` permission.

Adding attributes to objects
----------------------------

If you have permission to set the attribute key, you can add new attribute value using ``Add +`` button placed in ``Attributes`` box header.


.. image:: ../_static/zrJFQx3.gif
   :target: ../_static/zrJFQx3.gif
   :alt: 


Attributes can be added during object upload. It's really useful if you want to use attributes as plugin arguments e.g. provide password to the encrypted file/archive. That will allow to pass the password to the decryption routine just before the plugin hook is fired.


.. image:: ../_static/gdrzo1S.png
   :target: ../_static/gdrzo1S.png
   :alt: 


Another use case is passing source feed identifier with the uploaded file.

The same operations you can perform using mwdblib. Due to backwards compatibility reasons, attributes are called ``metakeys`` in API, but it's the same feature. Let's explore attributes for objects in mwdb.cert.pl:

.. code-block::

   ...

To add new attribute to the existing object, use `MalwarecageObject.add_metakey <https://mwdblib.readthedocs.io/en/latest/mwdbtypes.html#mwdblib.MalwarecageObject.add_metakey>`_ function. Example below will fail in mwdb.cert.pl because attribute ``test-key`` is probably undefined, but you can try it on your own instance!

.. code-block::

   ...

To add new attribute during upload, you can pass ``metakeys`` argument to the `Malwarecage.upload_file <https://mwdblib.readthedocs.io/en/latest/mwdblib.html#mwdblib.Malwarecage.upload_file>`_ routine.

.. code-block::

   ...

Removing attributes from objects
--------------------------------

...


Hidden (protected) attributes
-----------------------------

...

chapter about comments?
