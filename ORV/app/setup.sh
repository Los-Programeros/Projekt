#!/bin/bash

docker build -t model-image .
docker run -d --name model-container -p 5000:5000 --network backend-net model-image