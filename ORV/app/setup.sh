#!/bin/bash

mkdir -p data/user_faces data/models

docker build -t model-image .
docker run -d --name model-container \
  -p 5000:5000 \
  --network backend-net \
  -v "$(pwd)/data/user_faces:/app/data/user_faces" \
  -v "$(pwd)/data/models:/app/data/models" \
  -v "$(pwd)/data/negatives:/app/data/negatives" \
  model-image