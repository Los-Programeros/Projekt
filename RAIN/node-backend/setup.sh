#!/bin/bash

docker build -t node-image .
docker run -d --name node-container --network backend-net -p 3000:3000 node-image