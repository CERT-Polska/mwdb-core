7. Advanced search based on Lucene queries
==========================================

MWDB comes with a powerful search engine based on Lucene query syntax subset.

Query syntax: fields
--------------------

A query is broken up into fields and operators.

You can search any field by typing the field name followed by ":" and then the term value you are looking for.

.. code-block::

   tag:emotet

Multi-word terms separated by spaces or containing a special character (e.g. colon or parentheses) are called "phrases" and must be surrounded by double quotes

.. code-block::

   type:"PE32 executable (GUI) Intel 80386, for MS Windows"

Most fields support **wildcard search**. Symbol "?" represents a single character wildcard and "*" represents multiple characters (0 or more). If you want to include all PE executables in your results - use:

.. code-block::

   type:PE32*

Query syntax support escaping if you want to include '*' as a character. Query presented below looks for all type values that are containing asterisk:

.. code-block::

   type:"*\**"

Query syntax: operators
-----------------------

MWDB supports three boolean operators: ``AND``\ , ``OR`` and ``NOT``.

.. warning::
   
   Boolean operators must be UPPERCASE.


If you want to search all samples that are tagged with anything that contains "emotet" word (e.g ``emotet_drop``\ , ``ripped:emotet`` or just ``emotet``\ ) and exclude samples tagged as ``feed:spam`` - use:

.. code-block::

   tag:*emotet* AND NOT tag:"feed:spam"

Query syntax supports using parentheses to group logic expressions:

.. code-block::

   name:emotet* OR (tag:*emotet* AND NOT tag:"feed:spam")

Query syntax: ranges
--------------------

Integer and date fields support range search. Range queries can be inclusive or exclusive of the upper and lower bounds.

.. warning::

   ``TO`` operator must be UPPERCASE.


Query written below will find all files that have size between 50 and 50000 bytes inclusive:

.. code-block::

   size:[50 TO 50000]

If you want to exclude one of the range sides, replace "[" character with "{".

.. code-block::

   size:{50 TO 50000]

This will find files between 51 and 50000 bytes in size. Inclusive range queries are denoted by square brackets. Exclusive are denoted by curly brackets.

In most cases we want to search for that are only one-side bounded e.g. all files bigger than 50000 bytes. In that case, we can use single wildcard character to denote the infinity:

.. code-block::

   size:[50000 TO *]

This syntax is still not very convenient, so we have introduced shorter syntax incorporating ``>``\ , ``<``\ , ``>=`` and ``<=`` operators. To use them, just add appropriate operator to the beginning of a term.

.. code-block::

   size:>=500000
   size:">=500000"

MWDB-Core supports human-readable file size so instead of specifying the number of bytes, we can refer to larger units like kB, MB and GB.

.. code-block::

   size:>=500kB
   size:>=0.5MB

.. warning::

   Remember that converting a file size from bytes to human-readable form does not always match with the conversion the other way around.

   For example 1 kB equals 1024 bytes, rounding 1026 bytes to the second decimal number 1026 bytes will also give 1 kB (1.002 kB).

   So do not be surprised if you enter ``size:1kB`` in the search engine and a sample of this size is not found, because in bytes this size may differ slightly.

   For this reason, searching for a size from an object view always redirects to the query in bytes.

Query syntax: timestamps
------------------------

With timestamps you can search for objects within certain time range.

If you want to find samples that were uploaded from the beginning of September till the 28th:

.. code-block::

   upload_time:[2020-09-01 TO 2020-09-28]

If you want to find samples that were uploaded from the beginning of September:

.. code-block::

   upload_time:[2020-09-01 TO *]

Alternatively:

.. code-block::

   upload_time:>=2020-09-01

If you want to search for samples within time certain range:

.. code-block::

   upload_time:["2020-09-28 08:00" TO "2020-09-28 09:00"]

If you want to search for samples uploaded after certain hour:

.. code-block::

   upload_time:">=2020-09-28 08:00"

If you want to search for samples uploaded at certain minute:

.. code-block::

   upload_time:"2020-09-28 15:32"

Remember that exclusive range is not allowed for date-time field so this is not allowed:

.. code-block::

   upload_time:{2020-09-01 TO *]

   upload_time:>2020-09-01

Basic search fields
-------------------

Fields represent the object properties and can be **typed** (specific for object type) or **untyped** (generic, used by all object types).

Usage depends on the search context. If you're querying ``Recent files`` tab, query engine assumes that object type is ``file``. If you're using ``Search`` tab, you need to add appropriate type prefix to the typed fields.

In simple words: `name:` field in `Recent files\ ``must be replaced by``\ file.name:\ ``field in``\ Search`.

Untyped fields
^^^^^^^^^^^^^^


* ``dhash:<string>`` - Object identifier (SHA256)
* ``tag:<string>`` - Object tag
* ``comment:<string>`` - Object comment contents
* ``meta.<attribute>:<string>`` - Object attribute value
* ``upload_time:<datetime>`` - Object first upload timestamp
* ``karton:<uuid>`` - Karton analysis artifacts

Typed fields (file)
^^^^^^^^^^^^^^^^^^^


* ``file.name:<string>`` - Name of file
* ``file.type:<string>:`` - Type of file, returned by ``file`` Unix command
* ``file.size:<integer>:`` - Size of file in bytes
* ``file.md5:``\ , ``file.sha1:``\ , ``file.sha256:``\ , ``file.sha512:``\ , ``file.ssdeep:``\ , ``file.crc32:`` - File contents hashes and checksums

Typed fields (config)
^^^^^^^^^^^^^^^^^^^^^


* ``config.type:<string>`` - Type of configuration
* ``config.family:<string>`` - Malware family name
* ``config.cfg[<.path>]:<string>`` - JSON field with configuration contents

Typed fields (blob)
^^^^^^^^^^^^^^^^^^^


* ``blob.name:<string>`` - Name of blob
* ``blob.size:<integer>`` - Size of blob
* ``blob.type:<string>`` - Type of blob
* ``blob.content:<string>`` - Blob contents
* ``blob.first_seen:<datetime>`` - Alias for ``upload_time``
* ``blob.last_seen:<datetime>`` - Timestamp when blob was last uploaded

Special fields
^^^^^^^^^^^^^^

There are also other fields that have special meaning. They will be described in further sections of this chapter.


* ``favorites:<string>``
* ``shared:<string>``
* ``uploader:<string>``
* ``parent:<subquery>``
* ``child:<subquery>``

JSON fields (\ ``config.cfg:``\ )
---------------------------------

Configurations can be searched using path queries:

.. code-block::

   config.cfg.field_1.field_2:value

which would find configs that contain structure below:

.. code-block:: json

   {
       "field_1": {
           "field_2": "value"
      }
   }

Configurations are stored as JSON objects. The most simple way to search something inside configuration is to treat them as simple text fields and use wildcards.

Assuming we are in ``Recent configs`` tab:

.. code-block::

   cfg:*google.com*

If we want to be more specific and look for ``google.com`` only inside "urls" key, we can add a field name to ``cfg`` field using dot:

.. code-block::

   cfg.urls:*google.com*

If you want to search for elements contained in an array, simply use * at the end of the field where it is nested.

For example, let's use the following configuration.

.. code-block:: json

   {
       "field": {
           "array": [1, 2, 3]
      }
   }

In this case, to find the object, we can use array search to check if the nested array contains a specific value:

.. code-block::

   cfg.field.array*:1

Searching in this way applies to both numbers and strings contained in the array.

If you search by more than one value contained in an array, just type:

.. code-block::

   cfg.field.array*:"*1, 2*"

Favorites field (\ ``favorites:``\ )
------------------------------------------------------------

Typing the field ``favorites:`` you can search for your objects marked as favorite in object view.

.. code-block::

   favorites:<user login>

The above query returns the favorite objects of specific user.

.. warning::

    Remember that you can only search for your own favorites objects.

    Only system administrator with "manage_users" capabilities can search for other users favorites.

Comment author field (\ ``comment_author:``\ )
------------------------------------------------------------

Typing the field ``comment_author:`` you can search for objects commented by selected user.

.. code-block::

   comment_author:<user login>

The above query returns the objects commented by user <user login>.

.. warning::

    Remember that you can only search using logins for users registered in mwdb.
    Otherwise you receive error massage: ``No such user: <login>``.

    Wildcards are not allowed for field ``comment_author:``.

Group access queries (\ ``shared:`` and ``uploader:``\ )
------------------------------------------------------------

Search engine supports ``shared:`` and ``uploader:`` special fields that are useful for filtering out specific user or group uploads.


* ``shared:`` checks if object is explicitly shared with specific group or user
* ``uploader:`` checks if object was uploaded by specified user or any user from specified group

If you want to exclude objects shared with everyone (\ ``public`` group):

.. code-block::

   NOT shared:public

If you want to include only objects that are uploaded by yourself:

.. code-block::

   uploader:<your login>

If you want to see objects that are uploaded by somebody from your group excluding your own uploads:

.. code-block::

   uploader:<group name> AND NOT uploader:<your login>

Keep in mind that you can query only for objects uploaded by you or members of your own groups (excluding members of the ``public`` group). This limitation doesn't apply to administrators (``manage_users`` capability).

Read more about MWDB sharing model and capabilities in chapter :ref:`9. Sharing objects with other collaborators`.

Parent/child subqueries
-----------------------

MWDB allows to use parent/child subqueries.

If you want to search for samples that have ripped configuration for Emotet family as their child, go to ``Samples`` and type:

.. code-block::

   child:(config.family:emotet)

If you want to search for configs that have a sample as their parent with file size greater than 1000, go to ``Configs`` and type:

.. code-block::

   parent:(file.size:>1000)

Nested searches can be performed as well. If you want to find object which is parent of object tagged as ``emotet`` and grandparent of config object for Emotet family:

.. code-block::

   child:(tag:emotet AND child:(config.family:emotet))

Quick queries
-------------


.. image:: ../_static/xAYg8wA.png
   :target: ../_static/xAYg8wA.png
   :alt: 


Quick queries can be found just under the search field.

You can use quick query by clicking on one of the badges. First four queries are built-in:


* ``Only uploaded by me`` is ``uploader:<my login>`` query that can be used to filter only samples uploaded by ourselves
* ``Exclude public`` is ``NOT shared:public`` and filters out public objects
* ``Exclude feed:*`` is ``NOT tag:"feed:*"`` and excludes all the external feeds
* ``Only ripped:*`` is ``tag:"ripped:*"`` and includes only original samples recognized as malware and with successfully ripped configuration.

You can also add your own quick query by first typing the query in search field and then clicking on ``Add +``


.. image:: ../_static/2xw96CQ.gif
   :target: ../_static/2xw96CQ.gif
   :alt: 


Afterwards, you can see your newly added query as another black-coloured badge. You can click it any time and even the most complex query will be performed!


.. image:: ../_static/7dXJkSH.png
   :target: ../_static/7dXJkSH.png
   :alt: 

