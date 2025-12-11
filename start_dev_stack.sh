#!/bin/bash

echo "Starting Infrastructure (Kafka, Redis, Jaeger)..."
docker-compose -f deploy/docker-compose.yml up -d

echo "Waiting for Infrastructure..."
sleep 10

echo "Installing Dependencies..."
pip install -r services/transaction_manager/requirements.txt
pip install -r services/llm_manager/requirements.txt

# Start services in background (simple approach for dev)
echo "Starting Transaction Manager..."
cd services/transaction_manager
python main.py &
PID_TM=$!
cd ../..

echo "Starting LLM Manager..."
cd services/llm_manager
python main.py &
PID_LLM=$!
cd ../..

echo "Services running. PIDs: TM=$PID_TM, LLM=$PID_LLM"
echo "Press Ctrl+C to stop."

# Wait for process
wait $PID_TM $PID_LLM
