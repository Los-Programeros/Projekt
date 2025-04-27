#!/bin/bash

mkdir -p ./mosquitto/data
mkdir -p ./mosquitto/log

sudo docker run -d --name mosquitto-container -p 1883:1883 -v $(pwd)/mosquitto/config/mosquitto.conf:/mosquitto/config/mosquitto.conf -v $(pwd)/mosquitto/data:/mosquitto/data -v $(pwd)/mosquitto/log:/mosquitto/log eclipse-mosquitto