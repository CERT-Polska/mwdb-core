.. Malwarecage documentation master file, created by
   sphinx-quickstart on Tue Aug 18 16:40:35 2020.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Malwarecage
===========

Malware repository component for automated malware collection/analysis systems. You can use it to index and share your malware collections or provide convienient, unified interface for your malware analysis pipeline.

Under the hood of `mwdb.cert.pl service <https://mwdb.cert.pl/>`_ hosted by CERT.pl.

Features:

- Storage for malware binaries and static/dynamic malware configurations
- Tracking and visualizing relations between objects
- Quick search using Lucene-based syntax
- Data sharing and user management mechanism
- Integration capabilities via webhooks and plugin system   

.. toctree::
   :maxdepth: 2
   :caption: Documentation:
   
   setup_and_configuration
   guide/index
   integration_guide
   developer_guide

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
