#!/bin/bash

open -a Docker

# Wait until Docker daemon is running
while ! docker info > /dev/null 2>&1; do
  echo "Waiting for Docker to launch..."
  sleep 1
done

echo "Docker is running! Starting containers..."
docker-compose up -d 