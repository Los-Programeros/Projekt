#!/bin/bash

sudo docker network create backend-net
sudo docker run -d --name mongo-container --network backend-net -p 27017:27017 mongo