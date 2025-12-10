#!/bin/bash

# =============================================================================
# Graph Studio - Service Shutdown Script
# =============================================================================
# This script stops all services for the Graph Studio application.
# 
# Usage: ./stop_services.sh
# =============================================================================

# ========================= PORT CONFIGURATION =================================
# These must match the ports in start_services.sh

# Main Services
MAIN_FRONTEND_PORT=5173
MAIN_BACKEND_PORT=3001

# Panel Services - Figma X6 Editor
FIGMA_PANEL_BACKEND_PORT=3002
FIGMA_PANEL_FRONTEND_PORT=3000

# ========================= PATH CONFIGURATION =================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

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

# Stop a service by PID file
stop_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            log_info "Stopping $service_name (PID: $pid)..."
            kill $pid 2>/dev/null
            sleep 1
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null
            fi
            
            log_success "$service_name stopped"
        else
            log_warning "$service_name was not running (stale PID file)"
        fi
        rm -f "$pid_file"
    else
        log_warning "No PID file found for $service_name"
    fi
}

# Stop a service by port
stop_by_port() {
    local port=$1
    local service_name=$2
    
    local pids=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pids" ]; then
        log_info "Stopping $service_name on port $port..."
        echo "$pids" | xargs kill 2>/dev/null
        sleep 1
        
        # Force kill if still running
        pids=$(lsof -ti :$port 2>/dev/null)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs kill -9 2>/dev/null
        fi
        
        log_success "$service_name stopped"
    else
        log_warning "No process found on port $port ($service_name)"
    fi
}

# ========================= MAIN EXECUTION =====================================

echo ""
echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}       Graph Studio - Stopping All Services           ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo ""

# First, try to stop by PID files
log_info "Attempting to stop services by PID files..."
echo ""

stop_by_pid_file "$PID_DIR/main_frontend.pid" "Main Frontend"
stop_by_pid_file "$PID_DIR/main_backend.pid" "Main Backend"
stop_by_pid_file "$PID_DIR/figma_panel_backend.pid" "Figma Panel Backend"
stop_by_pid_file "$PID_DIR/figma_panel_frontend.pid" "Figma Panel Frontend"
stop_by_pid_file "$PID_DIR/figma_panel_mcp.pid" "Figma Panel MCP Server"

echo ""

# Then, clean up any remaining processes by port (fallback)
log_info "Cleaning up any remaining processes by port..."
echo ""

stop_by_port $MAIN_FRONTEND_PORT "Main Frontend"
stop_by_port $MAIN_BACKEND_PORT "Main Backend"
stop_by_port $FIGMA_PANEL_BACKEND_PORT "Figma Panel Backend"
stop_by_port $FIGMA_PANEL_FRONTEND_PORT "Figma Panel Frontend"

echo ""
echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}              All Services Stopped                    ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo ""

# Clean up PID directory if empty
if [ -d "$PID_DIR" ] && [ -z "$(ls -A "$PID_DIR")" ]; then
    rmdir "$PID_DIR"
fi

log_success "Cleanup complete!"
echo ""
