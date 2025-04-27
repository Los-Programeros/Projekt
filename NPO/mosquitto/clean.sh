#!/bin/bash

sudo docker container kill mosquitto-container
sudo docker container rm mosquitto-container

sudo rm -f mosquitto/log/mosquitto.log