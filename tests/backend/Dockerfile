# syntax=docker/dockerfile:1
# Inspired by https://github.com/astral-sh/uv-docker-example/blob/fa761744819c05f4ce207bde1f0a396f6be3915f/multistage.Dockerfile
FROM ghcr.io/astral-sh/uv:python3.12-alpine AS builder

WORKDIR /app

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
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --only-group test

COPY tests/backend/*.py /app/
WORKDIR /app
CMD ["uv", "run", "pytest", "-v", "--reruns", "3", "--only-rerun", "ConnectionError"]