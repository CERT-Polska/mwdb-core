#!/bin/sh

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# Install pre-commit
uv pip install pre-commit

# Install pre-commit hooks
pre-commit install --install-hooks

# Install all python packages
echo "Installing packages..."
export UV_VENV_CLEAR=1
uv venv
uv sync --locked
uv sync --locked --group dev
uv sync --locked --group test
source .venv/bin/activate
