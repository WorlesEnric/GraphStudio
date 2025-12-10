"""
Nexus Backend - FastAPI Application
Main entry point for the backend server.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import routers
from routers import ai
from config import get_settings

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Nexus Backend",
    description="Backend API for Nexus GraphStudio IDE",
    version="1.0.0",
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
        "message": "Welcome to Nexus API",
        "docs": "/docs",
        "health": "/ai/health",
    }


@app.get("/health")
def health_check():
    """Global health check endpoint."""
    return {"status": "healthy", "service": "nexus-backend"}


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