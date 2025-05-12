#!/bin/bash

docker container kill mosquitto-container
docker container rm mosquitto-container

rm -f mosquitto/log/mosquitto.log