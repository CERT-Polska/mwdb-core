FROM python:3.6-alpine

LABEL maintainer="info@cert.pl"

RUN apk add --no-cache postgresql-client postgresql-dev libmagic

COPY requirements.txt /tmp/requirements.txt
RUN apk add --no-cache -t build libffi libffi-dev py3-cffi build-base python3-dev automake m4 autoconf libtool \
    && BUILD_LIB=1 pip --no-cache-dir install -r /tmp/requirements.txt \
    && apk del build

# Install plugin requirements 
# Because of Docker limitations: at least one file must exist, so original requirements.txt is appended

COPY requirements.txt plugins/requirements-*.txt /tmp/

RUN ls /tmp/requirements-*.txt | xargs -i,, pip --no-cache-dir install -r ,,

# Copy backend files
COPY docker/start.sh docker/uwsgi.ini docker/mwdb.ini setup.py MANIFEST.in requirements.txt /app/
COPY mwdb /app/mwdb/

# Copy user-controlled plugins
COPY plugins /app/plugins

# Install mwdb-core package
RUN pip install /app

# Create a /app/uploads directory
# Give +r to everything in /app and +x for directories
# Give rwx permissions to /app/uploads for the current user
# By default everything is owned by root - change owner to nobody
RUN mkdir -p /app/uploads/ && \
    chmod o=rX -R /app && \
    chmod 700 /app/uploads/ && \
    chown nobody:nobody /app/uploads/

ENV PYTHONPATH=/app
ENV FLASK_APP=/app/mwdb/app.py
WORKDIR /app

CMD ["/app/start.sh"]
