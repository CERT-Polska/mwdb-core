#!/usr/bin/env bash
set -euo pipefail

show_help() {
cat <<EOF
Usage:
$(basename "$0") [--with FEATURE]...

Examples:
$(basename "$0") up -d
$(basename "$0") --with dev up -d
$(basename "$0") --with dev --with karton up -d

Available features:
EOF

shopt -s nullglob
for file in compose/compose.with-*.yml; do
    feature="${file#compose/compose.with-}"
    feature="${feature%.yml}"

    description=""
    if read -r first_line < "$file" && [[ "$first_line" =~ ^# ]]; then
        description="${first_line#\# }"
    fi

    printf "  %-15s %s\n" "$feature" "$description"
done

}

compose_files=(-f docker-compose.yml)
compose_args=()
wrapper_args_done=false

while [[ $# -gt 0 ]]; do
case "$1" in
  --help|-h)
  if ! $wrapper_args_done; then
    show_help
    exit 0
  fi

  compose_args+=("$1")
  shift
  ;;

  --with)
  if [[ $# -lt 2 ]]; then
    echo "Error: --with requires a value" >&2
    exit 1
  fi

  feature="$2"
  compose_files+=(-f "compose/compose.with-${feature}.yml")
  shift 2
  ;;

  *)
  wrapper_args_done=true
  compose_args+=("$1")
  shift
  ;;
esac

done

exec docker compose "${compose_files[@]}" "${compose_args[@]}"