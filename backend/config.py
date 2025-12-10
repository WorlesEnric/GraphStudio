"""
Configuration module for Nexus backend.
Loads environment variables and provides configuration for AI providers.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # AI Provider Configuration
    ai_provider: str = "openai"
    ai_model: str = "gpt-4o-mini"
    
    # API Keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    deepseek_api_key: Optional[str] = None
    siliconflow_api_key: Optional[str] = None
    
    # API Endpoints
    openai_base_url: str = "https://api.openai.com/v1"
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    siliconflow_base_url: str = "https://api.siliconflow.cn/v1"
    anthropic_base_url: str = "https://api.anthropic.com/v1"
    
    # Server Configuration
    port: int = 3001
    host: str = "0.0.0.0"
    access_code_list: Optional[str] = None
    
    # CORS Origins - can be set via CORS_ORIGINS env var (comma-separated)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    
    def get_cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        if not self.cors_origins:
            return []
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


# Provider configurations mapping
PROVIDER_CONFIGS = {
    "openai": {
        "base_url_key": "openai_base_url",
        "api_key_key": "openai_api_key",
        "default_model": "gpt-4o-mini",
    },
    "deepseek": {
        "base_url_key": "deepseek_base_url",
        "api_key_key": "deepseek_api_key",
        "default_model": "deepseek-chat",
    },
    "siliconflow": {
        "base_url_key": "siliconflow_base_url",
        "api_key_key": "siliconflow_api_key",
        "default_model": "MiniMaxAI/MiniMax-M2",
    },
    "anthropic": {
        "base_url_key": "anthropic_base_url",
        "api_key_key": "anthropic_api_key",
        "default_model": "claude-3-5-sonnet-20241022",
    },
}


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


def get_provider_config(provider: str) -> dict:
    """Get configuration for a specific provider."""
    settings = get_settings()
    
    if provider not in PROVIDER_CONFIGS:
        raise ValueError(f"Unknown provider: {provider}")
    
    config = PROVIDER_CONFIGS[provider]
    
    return {
        "base_url": getattr(settings, config["base_url_key"]),
        "api_key": getattr(settings, config["api_key_key"]),
        "default_model": config["default_model"],
    }


def get_active_provider_config() -> dict:
    """Get configuration for the currently active provider."""
    settings = get_settings()
    return {
        "provider": settings.ai_provider,
        "model": settings.ai_model,
        **get_provider_config(settings.ai_provider),
    }