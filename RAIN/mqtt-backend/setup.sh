#!/bin/bash

docker build -t mqtt-backend-image .
docker run -d --name mqtt-backend-container --network backend-net -p 3000:3000 mqtt-backend-image