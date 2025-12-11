#!/bin/bash
# Startup script for Nexus backend
# This ensures environment variables are loaded before starting uvicorn

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start uvicorn with reload
uvicorn main:app --reload --host "${HOST:-0.0.0.0}" --port "${PORT:-3001}"
