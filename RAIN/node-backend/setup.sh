#!/bin/bash

docker build -t node-image .
docker run -d --name node-container \
  --network backend-net \
  --add-host=host.docker.internal:host-gateway \
  -p 3000:3000 \
  node-image