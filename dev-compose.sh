#!/bin/bash

DOCKER_COMPOSE="docker compose -p mwdb-core"
DOCKER_COMPOSE_ARGS=()
DOCKER_COMPOSE_FILES=()
WITH_HOT_RELOAD="-f ./dev/compose/hot-reload.yml"
SHOW_CMD=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --with)
      shift # past argument
      case $1 in
        minio)
          EXTENSION="-f ./dev/compose/minio-base.yml -f ./dev/compose/minio.yml"
        ;;
        karton)
          EXTENSION="-f ./dev/compose/minio-base.yml -f ./dev/compose/karton.yml"
        ;;
        remote)
          EXTENSION="-f ./dev/compose/remote.yml"
        ;;
        oidc)
          EXTENSION="-f ./dev/compose/oidc.yml"
        ;;
        e2e)
          EXTENSION="-f ./dev/compose/e2e.yml"
          # Turn off hot reload when e2e is used
          WITH_HOT_RELOAD=""
        ;;
        *)
          echo "dev-compose.sh: Unknown extension '$1'"
          exit 1
        ;;
      esac
      DOCKER_COMPOSE_FILES+=("$EXTENSION")
      shift # past value
      ;;
    --show-cmd)
      SHOW_CMD=1
      shift # past argument
      ;;
    *)
      DOCKER_COMPOSE_ARGS+=("$1") # save arg
      shift # past argument
      ;;
  esac
done

CMD="${DOCKER_COMPOSE} -f ./dev/compose/base.yml ${WITH_HOT_RELOAD} ${DOCKER_COMPOSE_FILES[@]} ${DOCKER_COMPOSE_ARGS[@]}"
if [[ $SHOW_CMD -eq 0 ]] ;
then
  eval "$CMD"
else
  echo $CMD
fi
