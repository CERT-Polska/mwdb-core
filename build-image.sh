#!/bin/sh

docker build --cache-from "$1:$CI_COMMIT_REF_NAME" \
             --cache-from "$1:latest" \
             --tag "$1:$CI_COMMIT_SHA" \
             --tag "$1:$CI_COMMIT_REF_NAME" \
             --build-arg BUILDKIT_INLINE_CACHE=1 $2 || exit 1

echo "Pushing as $1:$CI_COMMIT_SHA"
time docker push "$1:$CI_COMMIT_SHA" > /dev/null

echo "Pushing as $1:$CI_COMMIT_REF_NAME"
time docker push "$1:$CI_COMMIT_REF_NAME" > /dev/null

if test "$CI_COMMIT_REF_NAME" = 'master'
then
    echo "Pushing as $1:latest"
    docker tag "$1:$CI_COMMIT_SHA" "$1:latest"
    time docker push "$1:latest" > /dev/null
fi
