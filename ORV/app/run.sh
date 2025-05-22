#!/bin/bash

# Build Docker image
echo "Building Docker image..."
docker build -t face-api .

# Check if container face-api-container že teče in ga ustavi in odstrani
if [ "$(docker ps -q -f name=face-api-container)" ]; then
    echo "Stopping running container face-api-container..."
    docker stop face-api-container
fi

if [ "$(docker ps -aq -f name=face-api-container)" ]; then
    echo "Removing container face-api-container..."
    docker rm face-api-container
fi

# Run Docker container z imenom face-api-container in preslikaj vrata
echo "Starting Docker container..."
docker run -d --name face-api-container -p 5000:5000 face-api

echo "Done! API on http://localhost:5000"
