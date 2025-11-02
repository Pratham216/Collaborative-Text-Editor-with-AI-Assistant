#!/bin/bash

# Deployment script for AWS EC2

echo "Starting deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file with required environment variables."
    exit 1
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Pull latest changes (if using git)
# git pull origin main

# Build and start containers
echo "Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "Deployment successful!"
    echo "Application is running on port 5000"
else
    echo "Deployment failed! Check logs with: docker-compose logs"
    exit 1
fi

