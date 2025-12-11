This document serves as the **Architecture Design Document (ADD)** for the Nexus Graph Studio refactoring. It consolidates the "Dual-Bus" communication strategy, the "Sidecar" isolation pattern, and the "Dual-Mode" sandbox deployment strategy into a single executable guide.

-----

# Nexus Graph Studio: Architecture Reference (v2.0)

**Version:** 2.1
**Status:** Revision in Progress
**Target Stack:** Python, FastAPI, Redis, Kafka, Kubernetes (GKE Autopilot)

-----

## 1\. Executive Summary

Nexus is a creative platform where users interact with various "Panels" (editors, code environments, etc.). The architecture functionality is split into two distinct planes:

1.  **The System Plane (Trusted):** High-performance, internal services (Orchestrator, DB, LLM Gateway).
2.  **The User Plane (Untrusted):** Dynamic, isolated environments where users develop and deploy their own panels.

To handle the requirements of real-time UI interaction vs. long-running LLM tasks, we employ a **Dual-Layer & Dual-Bus Architecture**:

*   **Service Layer (Transactional):** Handles user sessions, UI state, and database transactions.
*   **Semantic Layer (Intelligence):** Handles LLM context, inference, and "Panel-Local" agents.

We use **Redis** for the Service Layer and **Kafka** for the Semantic Layer.

-----

## 2\. Directory Structure (Monorepo)

The codebase is organized to separate shared infrastructure logic from business logic.

```text
nexus-graph-studio/
├── deploy/                        # Infrastructure-as-Code
│   ├── docker-compose.yml         # Local Dev Stack (Redis, NATS, Jaeger)
│   ├── prometheus.yml             # Metrics Scraper Config
│   └── k8s/                       # Production Kubernetes Manifests
│       ├── 01-infra.yaml          # NATS, Redis, Jaeger
│       ├── 02-services.yaml       # Core System Services (Orchestrator, etc)
│       ├── 03-security.yaml       # NetworkPolicies, RuntimeClass (gVisor)
│       └── templates/             # Jinja2 templates for dynamic Pod generation
│           ├── dev_pod.yaml       # Stateful (Mode 1: Studio)
│           └── prod_service.yaml  # Serverless (Mode 2: App)
├── packages/                      # SHARED LIBRARIES
│   └── nexus_core/                # The Framework SDK (The "Glue")
│       ├── __init__.py
│       ├── service.py             # Base Class (Auto-connects to NATS/Redis)
│       └── telemetry.py           # OTEL Tracing & Prometheus Metrics
├── services/                      # SYSTEM SERVICES
│   ├── transaction_manager/       # Service Layer: API, Auth, State (formerly Orchestrator)
│   ├── llm_manager/               # Semantic Layer: The Global "Brain" (Kafka Consumer)
│   ├── traffic_gateway/           # Dynamic Router (Frontend -> User Pods)
│   ├── panel_manager/             # K8s Controller (Spawns/Kills User Pods)
│   ├── sidecar_proxy/             # The "Bridge" inside User Pods
│   └── sandbox_watchdog/          # Cost-saver sidecar for Dev Mode
└── user_templates/                # Boilerplates for User Panels
    └── python_minimal/            # Zero-dependency example
```

-----

## 3\. The Dual-Bus Communication Strategy

We avoid a "one-size-fits-all" middleware. We maintain two parallel message pipelines.

### Pipeline A: The Service Layer (Transactional Bus)

  *   **Bus:** **Redis Pub/Sub** + HTTP.
  *   **Role:** Immediate feedback, UI synchronization, CRUD.
  *   **Manager:** `TransactionManager` Service.

### Pipeline B: The Semantic Layer (Semantic Bus)

  *   **Bus:** **Apache Kafka**.
  *   **Role:** LLM Thought Chains, Inter-Agent Communication (Global LLM <-> Panel Local LLMs).
  *   **Manager:** `LLMManager` Service.
  *   **Protocol:** Event-Driven. Components produce "Thoughts" or "ToolCalls" to Kafka topics (e.g., `semantic.events`, `semantic.commands`).
  *   **Why Kafka?** Replayability of "thought processes," strong ordering for causal reasoning, and high throughput for multi-agent chatter.

-----

## 4\. The Core Framework (`packages/nexus_core`)

All System Services and the Sidecar Proxy must inherit from `NexusService`. This abstract base class hides the complexity of the Dual Bus.

**Responsibilities of `nexus_core`:**

1.  **Lifecycle:** Auto-connect/disconnect NATS and Redis on startup/shutdown.
2.  **Tracing:** Auto-inject OpenTelemetry spans for every request (visible in Jaeger).
3.  **Metrics:** Auto-increment Prometheus counters for MCP tool usage (`nexus_mcp_exec_total`).
4.  **MCP Decorator:**
    ```python
    @service.register_mcp_tool("resize_image", "Resizes an image to WxH")
    async def handle_tool(width: int, height: int): ...
    ```
      * *Effect:* Automatically subscribes to the correct NATS subject and exposes the capability to the Orchestrator.

-----

## 5\. The User Sandbox Strategy (PaaS Layer)

This is the engine allowing users to build panels. We distinguish between **Development** (creating) and **Deployment** (using).

### 5.1 Security Architecture (Mandatory)

Since we run untrusted code, standard isolation is insufficient.

  * **Container Isolation:** Use **gVisor** (`RuntimeClass: gvisor`). This intercepts syscalls, preventing kernel-level escapes.
  * **Network Isolation:** `NetworkPolicy` must:
      * **Ingress:** ALLOW from `traffic_gateway` ONLY.
      * **Egress:**
          * DENY Internal IPs (10.x.x.x, 192.168.x.x).
          * DENY Cloud Metadata API (169.254.169.254) — *Critical for preventing credential theft.*
          * ALLOW Public Internet (for `pip/npm install`).

### 5.2 The "Pod Pair" Design (Sidecar Pattern)

Inside a single User Pod, we run two containers:

1.  **Container A (User Code):**
      * **Trust:** Zero.
      * **Network:** Localhost only.
      * **Code:** Standard Web Server (FastAPI/Express). No Nexus dependencies.
2.  **Container B (Sidecar - Trusted):**
      * **Trust:** High (Holds Redis/NATS credentials).
      * **Function:** Acts as the bridge.
          * *Inbound:* NATS Message $\rightarrow$ HTTP POST `localhost:8080/mcp/execute`.
          * *Outbound:* HTTP POST `localhost:3500/proxy` $\rightarrow$ Redis Pub/Sub.

-----

## 6\. Lifecycle Management: Studio vs. App

We support two distinct operational modes for user panels to balance UX and Cost.

| Feature | **Mode 1: Studio (Development)** | **Mode 2: App (Deployment)** |
| :--- | :--- | :--- |
| **Infrastructure** | Standard K8s Pod | **Knative Serving** Service |
| **State** | **Stateful** (PVC mounted to `/home`) | **Stateless** (Immutable Image) |
| **Persistence** | Files persist after stop | Data lost on restart |
| **Scaling** | 1 Replica (Singleton) | 0 to N Replicas (Auto-scale) |
| **Cost Control** | **Watchdog Sidecar** | **Scale-to-Zero** (Knative default) |
| **Startup Time** | Fast (Warm) | Slow (Cold Start \~2s) |
| **Lifecycle** | Kills self after 30m idle | Scales to 0 after 60s idle |

### The "Cost Saver" Watchdog

A lightweight Python script running in the Dev Pod.

  * Frontend sends heartbeat to `watchdog:9999` every 5 mins.
  * **Logic:** `if (now - last_heartbeat) > 30 mins: call K8s API to delete self`.

-----

## 7\. Infrastructure & Deployment Plan

**Recommended Cloud Provider:** Google Cloud Platform (GCP).
**Service:** GKE Autopilot.

### Why GKE Autopilot?

1.  **Native gVisor:** Enabled via checkbox. No manual setup of `runsc`.
2.  **Cost Management:** You pay per Pod resource requests, not per Node.
3.  **Knative Support:** Managed via "Cloud Run for Anthos" or standard Knative installation.

### Component Map

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Transaction Manager** | Python / FastAPI | Service Layer: API Gateway, Auth, WebSocket Sync. |
| **LLM Manager** | Python / KafkaConsumer | Semantic Layer: Listens to Kafka, queries LLMs, manages Context. |
| **Panel Manager** | Python / K8s API | Spawns Dev Pods and Knative Services. |
| **Traffic Gateway** | Python / FastAPI | Dynamic Reverse Proxy (maps `panel-id` to Pod IP). |
| **Semantic Bus** | **Apache Kafka** | The Nervous System (Events, Thoughts). |
| **Transactional Bus** | Redis | State Sync (Cursors, Real-time updates). |
| **Observability** | Jaeger + Prometheus | Distributed Tracing & Metrics. |

-----

## 8\. Refactoring Roadmap

### Phase 1: Foundation (Infrastructure)

1.  Set up the `nexus_core` library.
2.  Deploy NATS, Redis, and Jaeger via Docker Compose.
3.  Migrate the **Orchestrator** to use `nexus_core`.

### Phase 2: Service Migration

1.  Refactor existing panels (e.g., Document Editor) to inherit `nexus_core`.
2.  Split their logic:
      * State changes $\rightarrow$ Redis.
      * LLM Tooling $\rightarrow$ `@register_mcp_tool`.

### Phase 3: The Sandbox Engine

1.  Implement the **Sidecar Proxy**.
2.  Implement the **Traffic Gateway**.
3.  Create the `dev_pod.yaml` template with the Watchdog.

### Phase 4: Cloud Deployment

1.  Provision GKE Autopilot.
2.  Install Knative CRDs.
3.  Apply Network Policies (`03-security.yaml`).
4.  Deploy the **Panel Manager** to orchestrate user pods.

-----

## 9\. Developer Guidelines (For User Panels)

To create a new panel, a user writes a standard web server (e.g., in Python).

**Requirements:**

1.  **Port:** Listen on `8080`.
2.  **Manifest:** Expose `GET /manifest` returning `{"tools": [{"name": "...", "desc": "..."}]}`.
3.  **Execution:** Expose `POST /mcp/execute` to handle tasks.

*No SDK installation is required in the user's code.*