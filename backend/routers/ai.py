"""
AI Router - Handles chat completions and model management endpoints.
"""

import json
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import database
from services.ai_service import (
    AIService,
    get_ai_service,
    get_available_models,
    get_available_providers,
)
from config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai",
    tags=["ai"]
)


# === Request/Response Models ===

class ToolCallFunctionModel(BaseModel):
    """Tool call function model."""
    name: str
    arguments: str


class ToolCallModel(BaseModel):
    """Tool call model for assistant messages."""
    id: str
    type: str = "function"
    function: ToolCallFunctionModel


class MessageModel(BaseModel):
    """Chat message model."""
    role: str = Field(..., description="Message role: system, user, assistant, or tool")
    content: Optional[str] = Field(None, description="Message content (can be null for assistant with tool_calls)")
    name: Optional[str] = Field(None, description="Name for tool messages")
    tool_call_id: Optional[str] = Field(None, description="Tool call ID for tool responses")
    tool_calls: Optional[list[ToolCallModel]] = Field(None, description="Tool calls for assistant messages")


class ToolParameterModel(BaseModel):
    """Tool parameter schema."""
    type: str = "object"
    properties: dict = Field(default_factory=dict)
    required: list[str] = Field(default_factory=list)


class ToolFunctionModel(BaseModel):
    """Tool function definition."""
    name: str
    description: str = ""
    parameters: ToolParameterModel = Field(default_factory=ToolParameterModel)


class ToolModel(BaseModel):
    """Tool definition."""
    type: str = "function"
    function: ToolFunctionModel


class ChatCompletionRequest(BaseModel):
    """Chat completion request model."""
    messages: list[MessageModel]
    model: Optional[str] = None
    provider: Optional[str] = None
    tools: Optional[list[ToolModel]] = None
    temperature: float = Field(0.7, ge=0, le=2)
    max_tokens: int = Field(4096, ge=1, le=128000)
    stream: bool = True


class ProviderModel(BaseModel):
    """Provider information model."""
    id: str
    name: str
    configured: bool
    active: bool


class ModelInfo(BaseModel):
    """Model information model."""
    id: str
    name: str
    context: int


class ConfigResponse(BaseModel):
    """Configuration response model."""
    provider: str
    model: str
    providers: list[ProviderModel]
    models: list[ModelInfo]


# === Endpoints ===

@router.get("/config", response_model=ConfigResponse)
async def get_config():
    """
    Get current AI configuration including available providers and models.
    """
    settings = get_settings()
    providers = get_available_providers()
    models = get_available_models(settings.ai_provider)
    
    return {
        "provider": settings.ai_provider,
        "model": settings.ai_model,
        "providers": providers,
        "models": models,
    }


@router.get("/models/{provider}")
async def get_provider_models(provider: str):
    """
    Get available models for a specific provider.
    """
    models = get_available_models(provider)
    if not models:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider}")
    return {"models": models}


@router.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    """
    Create a chat completion.
    
    Supports both streaming and non-streaming responses.
    Compatible with OpenAI API format.
    """
    settings = get_settings()
    
    try:
        # Use provided provider/model or fall back to defaults
        provider = request.provider or settings.ai_provider
        model = request.model or settings.ai_model
        
        ai_service = AIService(provider=provider, model=model)
        
        # Convert messages to dict format
        messages = [msg.model_dump(exclude_none=True) for msg in request.messages]
        
        # Convert tools if provided
        tools = None
        if request.tools:
            tools = [tool.model_dump() for tool in request.tools]
        
        if request.stream:
            # Return streaming response
            return StreamingResponse(
                generate_stream(
                    ai_service=ai_service,
                    messages=messages,
                    tools=tools,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                ),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )
        else:
            # Return non-streaming response
            response = await ai_service.chat_completion(
                messages=messages,
                tools=tools,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )
            return response
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_stream(
    ai_service: AIService,
    messages: list[dict],
    tools: Optional[list[dict]],
    temperature: float,
    max_tokens: int,
):
    """
    Generate SSE stream for chat completion.
    """
    try:
        async for chunk in ai_service.chat_completion_stream(
            messages=messages,
            tools=tools,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            # Format as SSE
            data = json.dumps(chunk)
            yield f"data: {data}\n\n"
        
        # Send done signal
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.error(f"Stream generation error: {e}")
        error_data = json.dumps({"type": "error", "error": str(e)})
        yield f"data: {error_data}\n\n"


@router.post("/chat/completions/simple")
async def simple_chat_completion(request: ChatCompletionRequest):
    """
    Simplified chat completion that always returns a non-streaming response.
    Useful for tool execution flows.
    """
    settings = get_settings()
    
    try:
        provider = request.provider or settings.ai_provider
        model = request.model or settings.ai_model
        
        ai_service = AIService(provider=provider, model=model)
        messages = [msg.model_dump(exclude_none=True) for msg in request.messages]
        tools = [tool.model_dump() for tool in request.tools] if request.tools else None
        
        response = await ai_service.chat_completion(
            messages=messages,
            tools=tools,
            stream=False,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Simple chat completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ToolExecutionRequest(BaseModel):
    """Tool execution request."""
    tool_name: str
    tool_args: dict
    panel_id: str
    panel_type: str


@router.post("/tools/execute")
async def execute_tool(request: ToolExecutionRequest):
    """
    Execute a tool call.
    This endpoint is called by the frontend when the AI requests a tool execution.
    The actual tool execution happens in the frontend (panel-side).
    
    This endpoint can be used for server-side tool execution if needed.
    """
    # For now, return acknowledgment - actual execution happens client-side
    return {
        "status": "acknowledged",
        "message": f"Tool {request.tool_name} execution request received for panel {request.panel_id}",
    }


@router.get("/health")
async def health_check():
    """
    Health check endpoint for AI service.
    """
    settings = get_settings()
    
    return {
        "status": "healthy",
        "provider": settings.ai_provider,
        "model": settings.ai_model,
    }