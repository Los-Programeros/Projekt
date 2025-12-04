#!/bin/bash

# sudo chown -R devops:devops data/

mkdir -p data/user_faces data/models

docker network inspect backend-net >/dev/null 2>&1 || \
  docker network create backend-net

docker build -t model-image .
docker run -d --name model-container \
  -p 5000:5000 \
  --network backend-net \
  --user $(id -u):$(id -g) \
  -v "$(pwd)/data/user_faces:/app/data/user_faces" \
  -v "$(pwd)/data/models:/app/data/models" \
  -v "$(pwd)/data/negatives:/app/data/negatives" \
  model-image