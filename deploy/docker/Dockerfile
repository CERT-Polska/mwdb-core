FROM python:3.8-alpine AS build

WORKDIR /app
RUN python3 -m venv /app/venv
RUN /app/venv/bin/pip --no-cache-dir install wheel

RUN apk add --no-cache libffi libffi-dev py3-cffi build-base python3-dev automake m4 autoconf libtool gcc g++ musl-dev openssl-dev cargo postgresql-dev libfuzzy2-dev

COPY requirements.txt /app
RUN /app/venv/bin/pip --no-cache-dir install -r /app/requirements.txt

COPY docker/plugins /app/plugins
ARG plugins
RUN for plugin in $plugins $(find /app/plugins -name 'setup.py' -exec dirname {} \; | sort -u);  \
    do /app/venv/bin/pip --no-cache-dir install $plugin; done

FROM python:3.8-alpine

LABEL maintainer="info@cert.pl"

RUN apk add --no-cache postgresql-client postgresql-dev libmagic libfuzzy2-dev

# Copy backend files
COPY --from=build /app/venv /app/venv
COPY docker/ setup.py MANIFEST.in requirements.txt /app/
COPY mwdb /app/mwdb/

# Install mwdb-core package
RUN /app/venv/bin/pip install /app

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
