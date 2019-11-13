# Malwarecage

Malware repository component for automated malware collection/analysis systems. 

Under the hood of [MWDB service](https://mwdb.cert.pl) hosted by CERT.pl.

**Features:**

- Storage for malware binaries and static/dynamic configurations
- Tracking and visualizing relations between objects
- Quick search
- Data sharing mechanism
- Integration capabilities via webhooks and plugin system

## Basic installation via Docker Compose

The first step is to generate configuration using `./gen_vars.sh` script.

```
$ ./gen_vars.sh 
Credentials for initial mwdb account:

-----------------------------------------
Admin login: admin
Admin password: la/Z7MsmKA3UxW8Psrk1Opap
-----------------------------------------

Please be aware that initial account will be only set up on the first run. If you already have a database with at least one user, then this setting will be ignored for security reasons. You can always create an admin account manually by executing a command. See "flask create_admin --help" for reference.
```

Then build images via `docker-compose build` and run Malwarecage via `docker-compose up -d`.

Malwarecage should be accessible via `http://127.0.0.1`

You can customize your Malwarecage installation e.g. by adding persistent volumes to `docker-compose.yml`:

```yaml
services:
  ...
  mwdb:
    ...
    volumes:
      - type: volume
        source: mwcage-uploads
        target: /app/uploads
  postgres:
    ...
    volumes:
      - type: volume
        source: mwcage-postgres
        target: /var/lib/postgresql/data
  ...
volumes:
    mwcage-postgres:
    mwcage-uploads:
```

## Standalone installation

Currently it's quite complicated, but we'll provide appropriate instructions until final release. (TODO)

## Contact

In case of any questions, send e-mail at info@cert.pl