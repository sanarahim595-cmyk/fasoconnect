#!/usr/bin/env bash
set -euo pipefail

echo "Start the services in separate terminals:"
echo "1. docker compose up -d postgres"
echo "2. cd backend && uvicorn app.main:app --reload"
echo "3. cd frontend && npm run dev"
