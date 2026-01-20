#!/bin/bash

# ตั้งค่าชื่อ Image
DOCKER_USERNAME="rppskptrj"

echo "=========================================="
echo "   Starting LOCAL Deployment for Team 14"
echo "=========================================="

# ==========================================
# 0. CLEANUP OLD IMAGES & CONTAINERS
# ==========================================
echo "--------------------------------------"
echo "Step 0: Cleaning up old images and containers..."
echo "--------------------------------------"

echo "   Stopping and removing old containers..."
docker compose down

echo "   Removing ALL old team14 images..."
docker rmi -f team14-backend:latest 2>/dev/null || true
docker rmi -f team14-frontend:latest 2>/dev/null || true
docker rmi -f team14-nginx:latest 2>/dev/null || true
docker rmi -f team14-backend_init:latest 2>/dev/null || true
docker rmi -f $DOCKER_USERNAME/sut_team14_backend:latest 2>/dev/null || true
docker rmi -f $DOCKER_USERNAME/sut_team14_frontend:latest 2>/dev/null || true

echo "   Pruning unused images..."
docker image prune -f

# ==========================================
# 1. BUILD BACKEND
# ==========================================
echo "--------------------------------------"
echo "Step 1: Building Backend..."
echo "--------------------------------------"

cd backend

# Build Docker Image
echo "   Building Backend Docker Image..."
docker build --no-cache -t $DOCKER_USERNAME/sut_team14_backend:latest .

cd ..

# ==========================================
# 2. BUILD FRONTEND
# ==========================================
echo "--------------------------------------"
echo "Step 2: Building Frontend..."
echo "--------------------------------------"

cd frontend

echo "   Installing Dependencies & Building..."
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "Frontend Build Failed! Stopping."
    exit 1
fi

# Build Docker Image
echo "   Building Frontend Docker Image..."
docker build --no-cache -t $DOCKER_USERNAME/sut_team14_frontend:latest .

cd ..

# ==========================================
# 3. RESTART DOCKER COMPOSE
# ==========================================
echo "--------------------------------------"
echo "Step 3: Restarting Local Docker Compose..."
echo "--------------------------------------"

echo "   Starting new containers with fresh images..."
docker compose up -d --force-recreate

echo "   Cleaning up dangling images..."
docker image prune -f

echo "--------------------------------------"
echo "ALL DONE FOR LOCAL DEPLOYMENT!"
echo "--------------------------------------"

echo ""
echo "Listing running containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# เปิด
echo ""
echo "Opening Browser (https://sutportfolio.online)..."
start https://sutportfolio.online
