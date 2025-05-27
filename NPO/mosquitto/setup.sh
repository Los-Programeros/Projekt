#!/bin/bash

mkdir -p ./mosquitto/data
mkdir -p ./mosquitto/log

docker run -d --name mosquitto-container --network backend-net -p 1883:1883 -v $(pwd)/mosquitto/config/mosquitto.conf:/mosquitto/config/mosquitto.conf -v $(pwd)/mosquitto/data:/mosquitto/data -v $(pwd)/mosquitto/log:/mosquitto/log eclipse-mosquitto