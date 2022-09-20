Rich attributes guide
=====================

.. versionadded:: 2.8.0

.. warning::
    This feature is still **in development** and it may significantly change in the future versions.

Attributes can be used to store complex information in JSON format. In addition, values can be queried just like
configurations using ``attribute.<key>:<value>`` syntax.

Rich attribute templates combine forces of Mustache and Markdown languages to give you next level of flexibility in rendering
attribute values in UI without the need of writing additional plugins. Templates allow you to render value objects as custom
links, lists, tables or combinations of them. You can also combine your representation with other context values like
sample name or hash.

Rich attributes enable us to produce similar reports like Details section in VirusTotal
(e.g. https://www.virustotal.com/gui/file/32fae9922417d6405bf60144d819d5e02b44060fa8f07e5e71c824725f44307f/details)
based on data contained in attribute objects.

Getting started
---------------



Simple templates
----------------

Using rich attributes, we can replace legacy URL templates with Markdown representation.



Representing lists
------------------

Representing tables
-------------------

Plans and known issues
----------------------

