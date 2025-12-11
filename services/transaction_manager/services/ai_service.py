"""
AI Service - OpenAI-compatible client supporting multiple providers.
Handles chat completions with streaming support and tool calling.
"""

import json
import logging
from typing import AsyncGenerator, Optional, Any
from dataclasses import dataclass
import httpx
from functools import lru_cache

from config import get_settings, get_provider_config, PROVIDER_CONFIGS

logger = logging.getLogger(__name__)


@dataclass
class Message:
    """Chat message structure."""
    role: str
    content: str
    name: Optional[str] = None
    tool_calls: Optional[list] = None
    tool_call_id: Optional[str] = None


@dataclass 
class Tool:
    """Tool/function definition for LLM."""
    name: str
    description: str
    parameters: dict


class AIService:
    """
    OpenAI-compatible AI service supporting multiple providers.
    
    Supports:
    - OpenAI
    - DeepSeek
    - SiliconFlow
    - Anthropic (with adapter)
    """
    
    def __init__(
        self,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        settings = get_settings()
        
        self.provider = provider or settings.ai_provider
        self.model = model or settings.ai_model
        
        # Get provider-specific config
        provider_config = get_provider_config(self.provider)
        
        self.api_key = api_key or provider_config["api_key"]
        self.base_url = base_url or provider_config["base_url"]
        
        if not self.api_key:
            raise ValueError(f"No API key configured for provider: {self.provider}")
        
        logger.info(f"AIService initialized with provider={self.provider}, model={self.model}")
    
    def _get_headers(self) -> dict:
        """Get request headers based on provider."""
        headers = {
            "Content-Type": "application/json",
        }
        
        if self.provider == "anthropic":
            headers["x-api-key"] = self.api_key
            headers["anthropic-version"] = "2023-06-01"
        else:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        return headers
    
    def _build_request_body(
        self,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs
    ) -> dict:
        """Build request body based on provider."""
        
        if self.provider == "anthropic":
            # Convert to Anthropic format
            system_message = None
            converted_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    converted_messages.append({
                        "role": msg["role"],
                        "content": msg["content"],
                    })
            
            body = {
                "model": self.model,
                "messages": converted_messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": stream,
            }
            
            if system_message:
                body["system"] = system_message
            
            if tools:
                body["tools"] = self._convert_tools_to_anthropic(tools)
        else:
            # OpenAI-compatible format
            body = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": stream,
            }
            
            if tools:
                body["tools"] = tools
                body["tool_choice"] = "auto"
        
        # Add any additional kwargs
        body.update(kwargs)
        
        return body
    
    def _convert_tools_to_anthropic(self, tools: list[dict]) -> list[dict]:
        """Convert OpenAI tool format to Anthropic format."""
        converted = []
        for tool in tools:
            if tool.get("type") == "function":
                func = tool["function"]
                converted.append({
                    "name": func["name"],
                    "description": func.get("description", ""),
                    "input_schema": func.get("parameters", {"type": "object", "properties": {}}),
                })
        return converted
    
    async def chat_completion(
        self,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs
    ) -> dict:
        """
        Non-streaming chat completion.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            tools: Optional list of tool definitions
            stream: Should always be False for this method
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Completion response dict
        """
        endpoint = f"{self.base_url}/chat/completions"
        if self.provider == "anthropic":
            endpoint = f"{self.base_url}/messages"
        
        body = self._build_request_body(
            messages=messages,
            tools=tools,
            stream=False,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                endpoint,
                headers=self._get_headers(),
                json=body,
            )
            response.raise_for_status()
            return response.json()
    
    async def chat_completion_stream(
        self,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs
    ) -> AsyncGenerator[dict, None]:
        """
        Streaming chat completion.
        
        Yields:
            Stream chunks as dicts
        """
        endpoint = f"{self.base_url}/chat/completions"
        if self.provider == "anthropic":
            endpoint = f"{self.base_url}/messages"
        
        body = self._build_request_body(
            messages=messages,
            tools=tools,
            stream=True,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )
        
        logger.debug(f"Streaming request to {endpoint}")
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                endpoint,
                headers=self._get_headers(),
                json=body,
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        
                        if data == "[DONE]":
                            yield {"type": "done"}
                            break
                        
                        try:
                            chunk = json.loads(data)
                            
                            # Normalize to common format
                            if self.provider == "anthropic":
                                yield self._normalize_anthropic_chunk(chunk)
                            else:
                                yield self._normalize_openai_chunk(chunk)
                                
                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse chunk: {data}, error: {e}")
                            continue
    
    def _normalize_openai_chunk(self, chunk: dict) -> dict:
        """Normalize OpenAI streaming chunk to common format."""
        result = {"type": "chunk", "raw": chunk}
        
        if "choices" in chunk and len(chunk["choices"]) > 0:
            choice = chunk["choices"][0]
            delta = choice.get("delta", {})
            
            if "content" in delta:
                result["content"] = delta["content"]
            
            if "tool_calls" in delta:
                result["tool_calls"] = delta["tool_calls"]
            
            if choice.get("finish_reason"):
                result["finish_reason"] = choice["finish_reason"]
        
        return result
    
    def _normalize_anthropic_chunk(self, chunk: dict) -> dict:
        """Normalize Anthropic streaming chunk to common format."""
        result = {"type": "chunk", "raw": chunk}
        
        event_type = chunk.get("type")
        
        if event_type == "content_block_delta":
            delta = chunk.get("delta", {})
            if delta.get("type") == "text_delta":
                result["content"] = delta.get("text", "")
            elif delta.get("type") == "input_json_delta":
                result["tool_input_delta"] = delta.get("partial_json", "")
        
        elif event_type == "message_stop":
            result["finish_reason"] = "stop"
        
        elif event_type == "content_block_start":
            block = chunk.get("content_block", {})
            if block.get("type") == "tool_use":
                result["tool_call_start"] = {
                    "id": block.get("id"),
                    "name": block.get("name"),
                }
        
        return result
    
    async def execute_tool_call(
        self,
        tool_name: str,
        tool_args: dict,
        available_tools: dict[str, callable],
    ) -> Any:
        """
        Execute a tool call and return the result.
        
        Args:
            tool_name: Name of the tool to execute
            tool_args: Arguments for the tool
            available_tools: Dict mapping tool names to callable functions
            
        Returns:
            Tool execution result
        """
        if tool_name not in available_tools:
            return {"error": f"Unknown tool: {tool_name}"}
        
        try:
            tool_func = available_tools[tool_name]
            result = await tool_func(**tool_args)
            return result
        except Exception as e:
            logger.error(f"Tool execution error: {tool_name}, {e}")
            return {"error": str(e)}


@lru_cache()
def get_ai_service(
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> AIService:
    """Get cached AI service instance."""
    return AIService(provider=provider, model=model)


# Available models per provider
AVAILABLE_MODELS = {
    "openai": [
        {"id": "gpt-4o", "name": "GPT-4o", "context": 128000},
        {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "context": 128000},
        {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "context": 128000},
        {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "context": 16385},
    ],
    "deepseek": [
        {"id": "deepseek-chat", "name": "DeepSeek Chat", "context": 64000},
        {"id": "deepseek-coder", "name": "DeepSeek Coder", "context": 64000},
    ],
    "siliconflow": [
        {"id": "MiniMaxAI/MiniMax-M2", "name": "MiniMax M2", "context": 128000},
        {"id": "Qwen/Qwen2.5-72B-Instruct", "name": "Qwen 2.5 72B", "context": 32000},
        {"id": "deepseek-ai/DeepSeek-V3", "name": "DeepSeek V3", "context": 64000},
    ],
    "anthropic": [
        {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "context": 200000},
        {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "context": 200000},
        {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "context": 200000},
    ],
}


def get_available_models(provider: str) -> list[dict]:
    """Get available models for a provider."""
    return AVAILABLE_MODELS.get(provider, [])


def get_available_providers() -> list[dict]:
    """Get list of available providers with their status."""
    settings = get_settings()
    providers = []
    
    for provider_id, config in PROVIDER_CONFIGS.items():
        api_key = getattr(settings, config["api_key_key"])
        providers.append({
            "id": provider_id,
            "name": provider_id.title(),
            "configured": bool(api_key),
            "active": provider_id == settings.ai_provider,
        })
    
    return providers