# syntax=docker/dockerfile:1
# Inspired by https://github.com/astral-sh/uv-docker-example/blob/fa761744819c05f4ce207bde1f0a396f6be3915f/multistage.Dockerfile
FROM ghcr.io/astral-sh/uv:python3.12-alpine AS builder

WORKDIR /app

ENV UV_PYTHON_DOWNLOADS=0
ENV UV_LINK_MODE=copy

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --only-group test

COPY tests/backend/*.py /app/
WORKDIR /app
CMD ["uv", "run", "pytest", "-v", "--reruns", "3", "--only-rerun", "ConnectionError"]