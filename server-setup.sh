#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${YELLOW}Creating Docker network: backend-net${NC}"
docker network create backend-net

set -euo pipefail

mosquitto="NPO/mosquitto"
cd "$mosquitto" || exit 1
echo -e "${GREEN}Running setup for: $mosquitto${NC}"
timeout 1000 bash setup.sh
echo -e "${BLUE}Done with: $mosquitto${NC}"
cd ../..

model="ORV/app"
cd "$model" || exit 1
echo -e "${GREEN}Running setup for: $model${NC}"
timeout 1000 bash setup.sh
echo -e "${BLUE}Done with: $model${NC}"
cd ../..

mongo="RAIN/mongo"
cd "$mongo" || exit 1
echo -e "${GREEN}Running setup for: $mongo${NC}"
timeout 1000 bash setup.sh
echo -e "${BLUE}Done with: $mongo${NC}"
cd ../..

node="RAIN/node-backend"
cd "$node" || exit 1
echo -e "${GREEN}Running setup for: $node${NC}"
timeout 1000 bash setup.sh
echo -e "${BLUE}Done with: $node${NC}"
cd ../..

mqtt_backend="RAIN/mqtt-backend"
cd "$mqtt_backend" || exit 1
echo -e "${GREEN}Running setup for: $mqtt_backend${NC}"
timeout 1000 bash setup.sh
echo -e "${BLUE}Done with: $mqtt_backend${NC}"
cd ../..