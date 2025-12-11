#!/bin/bash
docker-compose -f deploy/docker-compose.yml down
pkill -f "services/transaction_manager/main.py"
pkill -f "services/llm_manager/main.py"
echo "Services stopped."
