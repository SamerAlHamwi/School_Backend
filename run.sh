#!/bin/bash
echo "Starting application setup..."

# Build the Docker containers
docker-compose build

# Start the services
docker-compose up -d

echo "Application is starting up..."
echo "App will be available at: http://153.92.214.111:8080"
echo "MongoDB will be available at: 153.92.214.111:27017"