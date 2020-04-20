FROM tiangolo/uwsgi-nginx-flask:python3.6-alpine3.8

LABEL maintainer="info@cert.pl"

RUN apk add --no-cache postgresql-client postgresql-dev libmagic

COPY requirements.txt /tmp/requirements.txt
RUN apk add --no-cache -t build libffi libffi-dev py3-cffi build-base python3-dev automake m4 perl autoconf libtool \
    && wget -O /tmp/ssdeep.tar.gz https://github.com/ssdeep-project/ssdeep/releases/download/release-2.14.1/ssdeep-2.14.1.tar.gz \
    && cd /tmp \
    && tar -xopf /tmp/ssdeep.tar.gz \
    && cd ssdeep-2.14.1 \
    && ./configure \
    && make \
    && make install \
    && cd /tmp && pip --no-cache-dir install -r requirements.txt \
    && apk del build

# Install plugin requirements 
# Because of Docker limitations: at least one file must exist, so original requirements.txt is appended

COPY requirements.txt plugins/requirements-*.txt /tmp/

RUN ls /tmp/requirements-*.txt | xargs -i,, pip --no-cache-dir install -r ,,

# Copy backend files

COPY prestart.sh uwsgi.ini plugin_engine.py app.py version.py /app/

COPY core /app/core
COPY migrations /app/migrations
COPY model /app/model
COPY resources /app/resources

# Copy user-controlled plugins
COPY plugins /app/plugins

# Copy user-controlled mail templates
COPY mail_templates /app/mail_templates

# Create a /app/uploads directory
# Give +r to everything in /app and +x for directories
# Give rwx permissions to /app/uploads for the current user
# By default everything is owned by root - change owner to nobody
RUN mkdir -p /app/uploads/ && \
    chmod o=rX -R /app && \
    chmod 700 /app/uploads/ && \
    chown nobody:nobody /app/uploads/
