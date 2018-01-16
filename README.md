# Malwarecage

Malware repository component for automated malware collection/analysis systems. 

Project is written in Python 2.7.

**Features**:
* Storage for malware binaries and static configurations
* Archive extraction (using [sflock](https://github.com/jbremer/sflock))
* Tracking associations between samples
* Sample and data sharing mechanism
* Integration capabilities with Cuckoo Sandbox and spam analysis systems
* REST API based on Bottle WSGI

## Installation

Malwarecage stores data in three kinds of storage:
* PostgreSQL database which stores information about samples, associations and other metadata.
* MongoDB database for static configurations
* File storage for binaries

So the first requirement is to have both database engines installed and configured.

Then - you need to install all required Python packages.

```
> pip install -r requirements.txt
```

Next step is `api.conf` file, where you need to provide paths and database connection strings suitable for your configuration. Required fields are described in `api.conf.example`.

Database queries use stored procedures, which need to be declared in database scheme. File `procedures.sql` contains required definitions.

```
> psql -d <database_name> -a -f ./procedures.sql 
```

## Usage

For testing purposes, just run Bottle server using:

```
> python api.py
```

On production server you can use any setup you want, but we highly recommend to configure server using [uWSGI and nginx](http://uwsgi-docs.readthedocs.io/en/latest/Nginx.html).

Supported endpoints are defined in `urls` package.

## Search engine

Two searching modes are supported:
* simple (`/search/simple`)
* full (`/search/full`)

Available keys: 

```
comment,sha1,source,tag,file_type,file_name,file_size,crc32,ssdeep,sha256,sha512,md5,hash
```

In `simple` mode you can search only for exact match, ie:
```
file_size:275351
```

In `full` mode you can create more elaborate queries, ie,

```
@tag = "nymaim" and @file_size < 30000
@ssdeep ~ "192:jRWscwoHtzn/WaOgiypWHXnih0Yfbr5tlVgqRzj2E48utAW0SD+0f:0woHB/FDiyIXimYTrlVgqRNPutAW0SD,54"
```
				       
Here is the grammar of `full` mode queries:

```
@field := @[a-zA-Z0-9_\-]+
@value := [^ ]+ | "[^ \"]"
@bool_op := or | and
@eq_op := = | > | < | <= | >= | ~ | like
@term := @field @eq_op @value  | not @expr
@expr := @term (@bool_op @term)*
```

## Contact

In case of any questions, send email at [info@cert.pl](mailto:info@cert.pl)