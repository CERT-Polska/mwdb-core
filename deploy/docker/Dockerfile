FROM python:3.8-alpine

LABEL maintainer="info@cert.pl"

RUN apk add --no-cache postgresql-client postgresql-dev libmagic

COPY requirements.txt docker/plugins/requirements-*.txt /tmp/
RUN apk add --no-cache -t build libffi libffi-dev py3-cffi build-base python3-dev automake m4 autoconf libtool gcc g++ musl-dev libffi-dev openssl-dev cargo \
    && BUILD_LIB=1 pip --no-cache-dir install -r /tmp/requirements.txt \
    && ls /tmp/requirements-*.txt | xargs -i,, pip --no-cache-dir install -r ,, \
    && apk del build

# Copy backend files
COPY docker/ setup.py MANIFEST.in requirements.txt /app/
COPY mwdb /app/mwdb/

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
