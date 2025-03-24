@echo off
title Start All Services

echo Starting database...
start "Database" cmd /c "cd database && docker compose up -d && echo Database started && pause"

echo Starting backend...
start "Backend" cmd /c "cd backend && npm run dev"

echo Starting frontend...
start "Frontend" cmd /c "cd frontend && npm run dev"

echo All services are starting in separate windows. 