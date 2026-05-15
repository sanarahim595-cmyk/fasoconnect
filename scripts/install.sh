#!/usr/bin/env bash
set -euo pipefail

echo "Installing FasoTontine dependencies..."

if [ -d "frontend" ]; then
  cd frontend
  npm install
  cd ..
fi

if [ -d "backend" ]; then
  cd backend
  python -m venv .venv
  . .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
  cd ..
fi

echo "Done."
