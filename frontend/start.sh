#!/bin/bash

# Stop and remove any existing container with the same name
docker stop storylabs-frontend 2>/dev/null || true
docker rm storylabs-frontend 2>/dev/null || true

# Build the Docker image
echo "Building Docker image..."
docker build -t storylabs-frontend .

# Run the container
echo "Starting container..."
docker run -d \
  --name storylabs-frontend \
  -p 3000:3000 \
  storylabs-frontend

echo "Frontend container is running on http://localhost:3000"