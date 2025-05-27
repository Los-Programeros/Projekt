#!/bin/bash

docker network create backend-net

set -euo pipefail

mosquitto="NPO/mosquitto"
cd $mosquitto
echo "Running: $mosquitto"
timeout 300 bash setup.sh
echo "Done"
cd ../..

model="ORV/app"
cd $model
echo "Running: $model"
timeout 300 bash setup.sh
echo "Done"
cd ../..

mongo="RAIN/mongo"
cd $mongo
echo "Running: $mongo"
timeout 300 bash setup.sh
echo "Done"
cd ../..

node="RAIN/node-backend"
cd $node
echo "Running: $node"
timeout 300 bash setup.sh
echo "Done"
cd ../..

mqtt_backend="RAIN/mqtt-backend"
cd $mqtt_backend
echo "Running: $mqtt_backend"
timeout 300 bash setup.sh
echo "Done"
cd ../..