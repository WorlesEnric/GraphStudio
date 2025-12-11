"""
Nexus Backend - Transaction Manager
Service Layer: Handles API, Auth, and State.
"""
import sys
import os

# Ensure shared packages are in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../packages')))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from nexus_core import NexusService
from config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import routers
from routers import ai

# Get settings
settings = get_settings()

class TransactionManagerService(NexusService):
    def __init__(self):
        super().__init__("transaction_manager", prometheus_port=8002)

transaction_manager = TransactionManagerService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Transaction Manager...")
    await transaction_manager.connect() # No consumer topics by default
    yield
    # Shutdown
    logger.info("Stopping Transaction Manager...")
    await transaction_manager.close()

# Create FastAPI app
app = FastAPI(
    title="Nexus Backend (Transaction Manager)",
    description="Service Layer API for Nexus GraphStudio",
    version="2.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai.router)

# Optional: Include auth and subscription routers if database is configured
try:
    from database import engine, Base
    from routers import auth, subscription
    
    Base.metadata.create_all(bind=engine)
    app.include_router(auth.router)
    app.include_router(subscription.router)
    logger.info("Database routers loaded")
except ImportError:
    logger.warning("Database not configured, auth/subscription routes disabled")
except Exception as e:
    logger.warning(f"Could not load database routers: {e}")


@app.get("/")
def read_root():
    """Root endpoint."""
    return {
        "message": "Nexus Transaction Manager Ready",
        "docs": "/docs",
        "layer": "Service (Transactional)"
    }


@app.get("/health")
def health_check():
    """Global health check endpoint."""
    return {"status": "healthy", "service": "transaction_manager", "connected": transaction_manager.running}


if __name__ == "__main__":
    import uvicorn
    
    # Use settings from config.py (which reads from env vars)
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )