#!/bin/bash

set -euo pipefail

mosquitto="NPO/mosquitto/clean.sh"
echo "Running: $mosquitto"
timeout 300 bash "$mosquitto"
echo "Done"

model="ORV/app/clean.sh"
echo "Running: $model"
timeout 300 bash "$model"
echo "Done"

mongo="RAIN/mongo/clean.sh"
echo "Running: $mongo"
timeout 300 bash "$mongo"
echo "Done"

node="RAIN/node-backend/clean.sh"
echo "Running: $node"
timeout 300 bash "$node"
echo "Done"

mqtt_backend="RAIN/mqtt-backend/clean.sh"
echo "Running: $mqtt_backend"
timeout 300 bash "$mqtt_backend"
echo "Done"