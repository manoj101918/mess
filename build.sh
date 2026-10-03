#!/usr/bin/env bash
# Render build: compile the React app and bundle it into the FastAPI service.
set -euo pipefail

cd frontend
npm ci
npm run build
cd ..

rm -rf backend/static
cp -r frontend/dist backend/static

pip install -r backend/requirements.txt
