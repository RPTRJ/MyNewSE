#!/bin/bash

# ตั้งค่าชื่อ Image 
DOCKER_USERNAME="rppskptrj"

echo "=========================================="
echo "   Starting LOCAL Deployment for Team 14"
echo "=========================================="

# ==========================================
# 1. BUILD BACKEND
# ==========================================
echo "--------------------------------------"
echo "Step 1: Building Backend..."
echo "--------------------------------------"

cd backend

# Build Docker Image
echo "   Building Backend Docker Image..."
docker build -t $DOCKER_USERNAME/sut_team14_backend:latest .

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
docker build -t $DOCKER_USERNAME/sut_team14_frontend:latest .

cd .. 

# ==========================================
# 3. RESTART DOCKER COMPOSE 
# ==========================================
echo "--------------------------------------"
echo "Step 3: Restarting Local Docker Compose..."
echo "--------------------------------------"

echo "   Stopping old containers..."
docker compose down

echo "   Starting new containers..."
docker compose up -d

docker image prune -f

echo "--------------------------------------"
echo "ALL DONE FOR LOCAL DEPLOYMENT!"
echo "--------------------------------------"

# เปิด
echo "Opening Browser (https://sutportfolio.online)..."
start https://sutportfolio.online
