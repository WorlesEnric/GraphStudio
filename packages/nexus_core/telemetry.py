from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import Counter, Histogram, start_http_server

# Metrics
MCP_EXEC_TOTAL = Counter('nexus_mcp_exec_total', 'Total MCP tool executions', ['tool_name', 'status'])
MCP_EXEC_DURATION = Histogram('nexus_mcp_exec_duration_seconds', 'Time spent executing MCP tools', ['tool_name'])

def setup_telemetry(service_name: str, jaeger_host: str = "localhost", prometheus_port: int = 8000):
    # Tracing Setup
    resource = Resource(attributes={
        "service.name": service_name
    })

    trace.set_tracer_provider(TracerProvider(resource=resource))
    
    # In production, this would likely point to an OTLP collector
    otlp_exporter = OTLPSpanExporter(endpoint=f"http://{jaeger_host}:4317", insecure=True)
    
    span_processor = BatchSpanProcessor(otlp_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)

    # Metrics Setup
    try:
        start_http_server(prometheus_port)
    except Exception as e:
        print(f"Warning: Prometheus server failed to start on port {prometheus_port}: {e}")

    return trace.get_tracer(service_name)
