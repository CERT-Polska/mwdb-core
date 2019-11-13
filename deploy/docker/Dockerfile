FROM tiangolo/uwsgi-nginx-flask:python3.6-alpine3.8

LABEL maintainer="info@cert.pl"

COPY requirements.txt /tmp/requirements.txt
COPY plugins /tmp/plugins/
RUN apk add --no-cache postgresql-client postgresql-dev libmagic \
    && apk add --no-cache -t build libffi libffi-dev py3-cffi build-base python3-dev automake m4 perl autoconf libtool \
    && wget -O /tmp/ssdeep.tar.gz https://github.com/ssdeep-project/ssdeep/releases/download/release-2.14.1/ssdeep-2.14.1.tar.gz \
    && cd /tmp \
    && tar -xopf /tmp/ssdeep.tar.gz \
    && cd ssdeep-2.14.1 \
    && ./configure \
    && make \
    && make install \
    && cd /tmp && pip --no-cache-dir install -r requirements.txt \
    && ls plugins/*/requirements.txt | xargs -i,, pip --no-cache-dir install -r ,, \
    && apk del build

COPY . /app
COPY config.docker.py /app/config.py

# Generate a swagger.json file
RUN python3 makespec.py

# Create a /app/uploads directory
RUN mkdir -p /app/uploads/

# Give +r to everything in /app and +x for directories
RUN chmod u=rX,go= -R /app

# Give rwx permissions to /app/uploads for the current user
RUN chmod 700 /app/uploads/

# By default everything is owned by root - change owner to nobody
RUN chown nobody:nobody -R /app
