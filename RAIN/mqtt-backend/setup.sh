#!/bin/bash

docker build -t mqtt-backend-image .
docker run -d --name mqtt-backend-container --network backend-net mqtt-backend-image