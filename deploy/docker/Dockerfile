# syntax=docker/dockerfile:1

FROM python:3.12-alpine AS build

WORKDIR /app

RUN apk add --no-cache libffi libffi-dev py3-cffi build-base python3-dev automake m4 autoconf libtool gcc g++ musl-dev openssl-dev cargo postgresql-dev libfuzzy2-dev curl ca-certificates

# Install UV
RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
    && mv /root/.local/bin/uv /usr/local/bin/uv \
    && mv /root/.local/bin/uvx /usr/local/bin/uvx

RUN uv venv venv --python=$(which python3)
ENV PATH="/app/venv/bin:$PATH"

RUN uv pip --no-cache-dir install wheel

COPY pyproject.toml uv.lock /app/
RUN uv sync --frozen

COPY docker/plugins /app/plugins
ARG plugins
RUN for plugin in $plugins $(find /app/plugins -name 'setup.py' -exec dirname {} \; | sort -u);  \
    do uv pip --no-cache-dir install $plugin; done

FROM python:3.12-alpine

LABEL maintainer="info@cert.pl"

RUN apk add --no-cache postgresql-client postgresql-dev libmagic libfuzzy2-dev

# Copy backend files
COPY --from=build /app/venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

COPY --from=build /usr/local/bin/uv /usr/local/bin/uv
COPY --from=build /usr/local/bin/uvx /usr/local/bin/uvx

COPY docker/ setup.py MANIFEST.in requirements.txt /app/
COPY mwdb /app/mwdb/

# Install mwdb-core package
RUN uv pip install /app
RUN uv pip install gunicorn

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
