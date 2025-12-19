#!/bin/sh

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# Install pre-commit
uv pip install pre-commit

# Install pre-commit hooks
pre-commit install --install-hooks

for arg in "$@"; do
    if [[ "$arg" == "install-python-packages" ]]; then
        echo "Installing packages..."
        export UV_VENV_CLEAR=1
        uv venv
        uv sync --frozen
        source .venv/bin/activate
    fi
done