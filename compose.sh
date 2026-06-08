#!/usr/bin/env bash
set -euo pipefail

compose_files=(-f docker-compose.yml)
compose_args=()

while [[ $# -gt 0 ]]; do
case "$1" in --with)
  if [[ $# -lt 2 ]]; then
    echo "Error: --with requires a value" >&2
    exit 1
  fi

  feature="$2"
  compose_files+=(-f "compose/compose.with-${feature}.yml")
  shift 2
  ;;

  *)
  compose_args+=("$1")
  shift
  ;;
esac

done

exec docker compose "${compose_files[@]}" "${compose_args[@]}"