#!/bin/bash

# =============================================================================
# Graph Studio - Service Startup Script
# =============================================================================
# This script starts all services for the Graph Studio application.
# 
# Services:
#   1. Main Frontend (Vite) - React frontend application
#   2. Main Backend (Python/FastAPI) - Core API server
#   3. Figma-X6-Editor Panel Backend (Node.js/Express) - Panel-specific API
#   4. Figma-X6-Editor Panel Frontend (Vite) - Panel-specific frontend (if standalone)
#
# Usage: ./start_services.sh
# =============================================================================

# ========================= PORT CONFIGURATION =================================
# Modify these ports as needed for your environment

# Main Services
MAIN_FRONTEND_PORT=5173
MAIN_BACKEND_PORT=3001

# Panel Services - Figma X6 Editor
FIGMA_PANEL_BACKEND_PORT=3002
FIGMA_PANEL_FRONTEND_PORT=3000

# MCP Servers (Model Context Protocol for LLM integration)
# Note: MCP servers typically run on stdio, not a specific port
# But we track them for process management

# ========================= PATH CONFIGURATION =================================
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Service directories
MAIN_FRONTEND_DIR="$SCRIPT_DIR"
MAIN_BACKEND_DIR="$SCRIPT_DIR/backend"
FIGMA_PANEL_BACKEND_DIR="$SCRIPT_DIR/src/panels/figma-x6-editor/backend"
FIGMA_PANEL_FRONTEND_DIR="$SCRIPT_DIR/src/panels/figma-x6-editor/frontend"

# ========================= PID FILE CONFIGURATION =============================
PID_DIR="$SCRIPT_DIR/.pids"
mkdir -p "$PID_DIR"

MAIN_FRONTEND_PID_FILE="$PID_DIR/main_frontend.pid"
MAIN_BACKEND_PID_FILE="$PID_DIR/main_backend.pid"
FIGMA_PANEL_BACKEND_PID_FILE="$PID_DIR/figma_panel_backend.pid"
FIGMA_PANEL_MCP_PID_FILE="$PID_DIR/figma_panel_mcp.pid"
FIGMA_PANEL_FRONTEND_PID_FILE="$PID_DIR/figma_panel_frontend.pid"

# ========================= LOG FILE CONFIGURATION =============================
LOG_DIR="$SCRIPT_DIR/.logs"
mkdir -p "$LOG_DIR"

# ========================= COLORS FOR OUTPUT ==================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ========================= HELPER FUNCTIONS ===================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "  Waiting for $name (port $port)..."
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            echo -e " ${GREEN}Ready!${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}Timeout!${NC}"
    return 1
}

# ========================= SERVICE START FUNCTIONS ============================

start_main_frontend() {
    log_info "Starting Main Frontend (Vite) on port $MAIN_FRONTEND_PORT..."
    
    if check_port $MAIN_FRONTEND_PORT; then
        log_warning "Port $MAIN_FRONTEND_PORT is already in use. Skipping main frontend."
        return 1
    fi
    
    cd "$MAIN_FRONTEND_DIR"
    VITE_PORT=$MAIN_FRONTEND_PORT npm run dev > "$LOG_DIR/main_frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "$MAIN_FRONTEND_PID_FILE"
    
    wait_for_service $MAIN_FRONTEND_PORT "Main Frontend"
    log_success "Main Frontend started (PID: $pid)"
}

start_main_backend() {
    log_info "Starting Main Backend (FastAPI) on port $MAIN_BACKEND_PORT..."
    
    if check_port $MAIN_BACKEND_PORT; then
        log_warning "Port $MAIN_BACKEND_PORT is already in use. Skipping main backend."
        return 1
    fi
    
    cd "$MAIN_BACKEND_DIR"
    
    # Check if virtual environment exists, if not use system python
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    fi
    
    # Load environment variables from .env if it exists
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Override the port from config
    PORT=$MAIN_BACKEND_PORT HOST=0.0.0.0 uvicorn main:app --reload --host 0.0.0.0 --port $MAIN_BACKEND_PORT > "$LOG_DIR/main_backend.log" 2>&1 &
    local pid=$!
    echo $pid > "$MAIN_BACKEND_PID_FILE"
    
    wait_for_service $MAIN_BACKEND_PORT "Main Backend"
    log_success "Main Backend started (PID: $pid)"
}

start_figma_panel_backend() {
    log_info "Starting Figma X6 Editor Panel Backend (Node.js) on port $FIGMA_PANEL_BACKEND_PORT..."
    
    if check_port $FIGMA_PANEL_BACKEND_PORT; then
        log_warning "Port $FIGMA_PANEL_BACKEND_PORT is already in use. Skipping Figma panel backend."
        return 1
    fi
    
    cd "$FIGMA_PANEL_BACKEND_DIR"
    
    # Load environment variables from .env if it exists
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Override the port
    PORT=$FIGMA_PANEL_BACKEND_PORT npm run dev > "$LOG_DIR/figma_panel_backend.log" 2>&1 &
    local pid=$!
    echo $pid > "$FIGMA_PANEL_BACKEND_PID_FILE"
    
    wait_for_service $FIGMA_PANEL_BACKEND_PORT "Figma Panel Backend"
    log_success "Figma Panel Backend started (PID: $pid)"
}

start_figma_panel_mcp() {
    log_info "Starting Figma X6 Editor Panel MCP Server (stdio-based)..."
    
    cd "$FIGMA_PANEL_BACKEND_DIR"
    
    # Load environment variables from .env if it exists
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # MCP server runs on stdio, we redirect its output to a log file
    # This is useful for debugging but the server is meant to be connected via stdio by the Chat Panel
    npm run mcp > "$LOG_DIR/figma_panel_mcp.log" 2>&1 &
    local pid=$!
    echo $pid > "$FIGMA_PANEL_MCP_PID_FILE"
    
    sleep 1
    if ps -p $pid > /dev/null 2>&1; then
        log_success "Figma Panel MCP Server started (PID: $pid)"
    else
        log_error "Figma Panel MCP Server failed to start. Check $LOG_DIR/figma_panel_mcp.log"
        return 1
    fi
}

start_figma_panel_frontend() {
    log_info "Starting Figma X6 Editor Panel Frontend (Vite) on port $FIGMA_PANEL_FRONTEND_PORT..."
    
    if check_port $FIGMA_PANEL_FRONTEND_PORT; then
        log_warning "Port $FIGMA_PANEL_FRONTEND_PORT is already in use. Skipping Figma panel frontend."
        return 1
    fi
    
    cd "$FIGMA_PANEL_FRONTEND_DIR"
    
    # Set the API base URL to point to the panel backend
    VITE_PORT=$FIGMA_PANEL_FRONTEND_PORT VITE_API_BASE_URL=http://localhost:$FIGMA_PANEL_BACKEND_PORT npm run dev > "$LOG_DIR/figma_panel_frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "$FIGMA_PANEL_FRONTEND_PID_FILE"
    
    wait_for_service $FIGMA_PANEL_FRONTEND_PORT "Figma Panel Frontend"
    log_success "Figma Panel Frontend started (PID: $pid)"
}

# ========================= MAIN EXECUTION =====================================

echo ""
echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}       Graph Studio - Starting All Services           ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo ""

log_info "Configuration:"
echo "  Main Frontend Port:         $MAIN_FRONTEND_PORT"
echo "  Main Backend Port:          $MAIN_BACKEND_PORT"
echo "  Figma Panel Backend Port:   $FIGMA_PANEL_BACKEND_PORT"
echo "  Figma Panel Frontend Port:  $FIGMA_PANEL_FRONTEND_PORT"
echo ""

# Start services
start_main_backend
start_main_frontend
start_figma_panel_backend
start_figma_panel_mcp
# Note: Figma panel frontend is typically not needed when embedded in main frontend
# Uncomment the following line if you need to run it standalone:
# start_figma_panel_frontend

echo ""
echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}                 Services Summary                     ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo ""
echo "Running services:"
echo "  - Main Frontend:        http://localhost:$MAIN_FRONTEND_PORT"
echo "  - Main Backend:         http://localhost:$MAIN_BACKEND_PORT"
echo "  - Figma Panel Backend:  http://localhost:$FIGMA_PANEL_BACKEND_PORT"
echo "  - Figma Panel MCP:      (stdio-based, for LLM integration)"
echo ""
echo "Log files are located in: $LOG_DIR"
echo "PID files are located in: $PID_DIR"
echo ""
echo -e "To stop all services, run: ${YELLOW}./stop_services.sh${NC}"
echo ""
