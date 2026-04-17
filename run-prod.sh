#!/bin/bash

# Stop the script immediately if any command fails
set -e

echo "==================================================="
echo "🚀 STARTING GocTriThuc DEPLOYMENT PREPARATION"
echo "==================================================="

echo -e "\n[1/4] 📦 Building the React Frontend..."
cd frontend
pnpm install
pnpm build
cd ..

echo -e "\n[2/4] 📂 Moving Frontend to Spring Boot..."
# Clean the old static directory and recreate it
rm -rf backend/src/main/resources/static
mkdir -p backend/src/main/resources/static
# Copy the compiled React files
cp -r frontend/dist/* backend/src/main/resources/static/

echo -e "\n[3/4] ☕ Building the Spring Boot Backend..."
cd backend
# Compile the Java app (skipping tests to speed up deployment)
./mvnw clean package -DskipTests || mvn clean package -DskipTests
cd ..

echo -e "\n[4/4] 🐳 Starting Docker Containers..."
docker compose -f docker-compose.prod.yml up -d
