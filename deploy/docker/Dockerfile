# syntax=docker/dockerfile:1
# Inspired by https://github.com/astral-sh/uv-docker-example/blob/fa761744819c05f4ce207bde1f0a396f6be3915f/multistage.Dockerfile
FROM ghcr.io/astral-sh/uv:python3.12-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libffi libffi-dev py3-cffi build-base python3-dev automake m4 autoconf libtool gcc g++ musl-dev openssl-dev cargo postgresql-dev libfuzzy2-dev curl ca-certificates

# Omit development dependencies
ENV UV_NO_DEV=1

# Disable Python downloads, because we want to use the system interpreter
# across both images. If using a managed Python version, it needs to be
# copied from the build image into the final image; see `standalone.Dockerfile`
# for an example.
ENV UV_PYTHON_DOWNLOADS=0
# No hardlinks supported
ENV UV_LINK_MODE=copy

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=ssdeep-build-constraints.txt,target=ssdeep-build-constraints.txt \
    uv venv && uv pip install ssdeep==3.4 --build-constraints=./ssdeep-build-constraints.txt

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

COPY mwdb /app/mwdb
COPY docker/ pyproject.toml uv.lock /app/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install /app

ARG plugins
RUN --mount=type=cache,target=/root/.cache/uv \
    for plugin in $plugins $(find /app/plugins \( -name 'setup.py' -o -name 'pyproject.toml' \) -exec dirname {} \; | sort -u);  \
    do uv pip --no-cache-dir install $plugin; done

FROM python:3.12-alpine

LABEL maintainer="info@cert.pl"

RUN apk add --no-cache postgresql-client postgresql-dev libmagic libfuzzy2-dev

# Copy the application from the builder
COPY --from=builder --chown=nobody:nobody /app /app
ENV PATH="/app/venv/bin:$PATH"

USER nobody
RUN mkdir -m 700 /app/uploads

ENV PYTHONPATH=/app
# We still load it directly from the source and not the installed package in .venv
# to make it "editable" in dev environments
ENV FLASK_APP=/app/mwdb/app.py
WORKDIR /app

CMD ["/app/start.sh"]
