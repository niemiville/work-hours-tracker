#!/bin/bash
# Start All Services on bash (Linux)

echo "Starting database..."
( cd database && docker compose up -d && echo "Database started" )

echo "Starting backend..."
( cd backend && npm run dev & )

echo "Starting frontend..."
( cd frontend && npm run dev & )

echo "All services are starting in separate terminals."