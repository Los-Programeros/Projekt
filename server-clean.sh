#!/bin/bash

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

mosquitto="NPO/mosquitto/clean.sh"
echo -e "${GREEN}Running: $mosquitto${NC}"
timeout 300 bash "$mosquitto"
echo -e "${BLUE}Done${NC}"

model="ORV/app/clean.sh"
echo -e "${GREEN}Running: $model${NC}"
timeout 300 bash "$model"
echo -e "${BLUE}Done${NC}"

mongo="RAIN/mongo/clean.sh"
echo -e "${GREEN}Running: $mongo${NC}"
timeout 300 bash "$mongo"
echo -e "${BLUE}Done${NC}"

node="RAIN/node-backend/clean.sh"
echo -e "${GREEN}Running: $node${NC}"
timeout 300 bash "$node"
echo -e "${BLUE}Done${NC}"

mqtt_backend="RAIN/mqtt-backend/clean.sh"
echo -e "${GREEN}Running: $mqtt_backend${NC}"
timeout 300 bash "$mqtt_backend"
echo -e "${BLUE}Done${NC}"