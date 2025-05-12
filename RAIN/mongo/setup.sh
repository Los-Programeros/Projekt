#!/bin/bash

docker network create backend-net
docker run -d --name mongo-container --network backend-net -p 27017:27017 -v mongo-data:/data/db mongo