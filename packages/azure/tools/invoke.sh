#!/bin/bash

curl -X POST \
    -H cache-control: no-cache \
    -H content-type: application/json \
    -d "{\"size\": \"$size\"}" \
    $url
