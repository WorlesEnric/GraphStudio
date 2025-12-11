import asyncio
import json
import logging
import os
import signal
from typing import Callable, Any, Dict, List, Optional
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
import redis.asyncio as redis
from .telemetry import setup_telemetry, MCP_EXEC_TOTAL, MCP_EXEC_DURATION

logger = logging.getLogger("nexus.core")

class NexusService:
    def __init__(self, service_name: str, kafka_url: str = "localhost:9094", redis_url: str = "redis://localhost:6379", prometheus_port: int = 8000):
        self.service_name = service_name
        self.kafka_url = kafka_url
        self.redis_url = redis_url
        
        self.producer = None
        self.consumer = None
        self.redis = None
        
        self.tracer = setup_telemetry(service_name, prometheus_port=prometheus_port)
        self.mcp_tools: Dict[str, Callable] = {}
        self.running = False
        self.kafka_topics = []

    async def connect(self, consumer_topics: List[str] = None):
        """Connects to Kafka (Producer & Consumer) and Redis."""
        logger.info(f"Connecting to Kafka at {self.kafka_url}...")
        
        # Producer
        self.producer = AIOKafkaProducer(bootstrap_servers=self.kafka_url)
        await self.producer.start()

        # Consumer (optional)
        if consumer_topics:
            self.kafka_topics = consumer_topics
            self.consumer = AIOKafkaConsumer(
                *consumer_topics,
                bootstrap_servers=self.kafka_url,
                group_id=f"{self.service_name}-group"
            )
            await self.consumer.start()
            logger.info(f"Subscribed to topics: {consumer_topics}")

        logger.info(f"Connecting to Redis at {self.redis_url}...")
        self.redis = redis.from_url(self.redis_url)
        
        self.running = True
        logger.info(f"{self.service_name} started.")

    async def close(self):
        """Closes connections."""
        self.running = False
        if self.producer:
            await self.producer.stop()
        if self.consumer:
            await self.consumer.stop()
        if self.redis:
            await self.redis.close()
        logger.info(f"{self.service_name} stopped.")

    async def send_event(self, topic: str, event_type: str, payload: Dict[str, Any]):
        """Sends a JSON event to Kafka."""
        message = {
            "source": self.service_name,
            "type": event_type,
            "payload": payload
        }
        await self.producer.send_and_wait(topic, json.dumps(message).encode("utf-8"))

    async def consume_messages(self, handler: Callable[[str, Dict], Any]):
        """Runs a message consumption loop."""
        if not self.consumer:
            logger.warning("No consumer configured.")
            return

        try:
            async for msg in self.consumer:
                try:
                    data = json.loads(msg.value.decode("utf-8"))
                    await handler(msg.topic, data)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
        except Exception as e:
            logger.error(f"Kafka consumer error: {e}")

    def register_mcp_tool(self, name: str, description: str):
        """Decorator to register an MCP tool."""
        def decorator(func: Callable):
            self.mcp_tools[name] = func
            return func
        return decorator

    async def run(self, consumer_topics: List[str] = None, handler: Callable = None):
        """Main loop."""
        await self.connect(consumer_topics)
        
        # Start consumer task if handler provided
        consumer_task = None
        if self.consumer and handler:
            consumer_task = asyncio.create_task(self.consume_messages(handler))
        
        stop_event = asyncio.Event()
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, stop_event.set)
            
        await stop_event.wait()
        
        if consumer_task:
            consumer_task.cancel()
        
        await self.close()
