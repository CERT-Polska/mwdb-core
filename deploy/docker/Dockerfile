FROM python:3.8-alpine as base

LABEL maintainer="info@cert.pl"

ENV PIP_DEFAULT_TIMEOUT=100 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=1.1.13

FROM base as builder

WORKDIR /app
# Install build-time Alpine dependencies
RUN apk add --no-cache postgresql-client postgresql-dev libmagic && \
    apk add --no-cache libffi libffi-dev py3-cffi build-base python3-dev automake m4 autoconf libtool gcc g++ musl-dev libffi-dev openssl-dev cargo && \
    pip install "poetry==$POETRY_VERSION"
# Create virtualenv and install build-time Python dependencies
RUN python3 -m venv /app/.venv && /app/.venv/bin/pip install wheel
# Copy MWDB Core code
COPY pyproject.toml poetry.lock poetry.toml README.md /app/
COPY mwdb /app/mwdb/
# Install project into /app/.venv (in-project=true)
RUN BUILD_LIB=1 poetry install -n --no-dev

FROM base as final

WORKDIR /app
RUN apk add --no-cache postgresql-client postgresql-dev libmagic
# Copy backend files
COPY docker/ /app/
COPY mwdb /app/mwdb/
COPY --from=builder /app/.venv /app/.venv
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
CMD ["/app/start.sh"]
