# ThingsBoard Architecture

This document provides an overview of ThingsBoard's system architecture, key components, and design patterns.

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Module Architecture](#module-architecture)
- [Database Schema](#database-schema)
- [Transport Protocols](#transport-protocols)
- [Rule Engine](#rule-engine)
- [Scalability](#scalability)
- [Security](#security)

## Overview

ThingsBoard is an open-source IoT platform built with:
- **Backend**: Java Spring Boot
- **Frontend**: React with TypeScript
- **Legacy Frontend**: Angular (ui-ngx)
- **Database**: PostgreSQL (primary), Cassandra (optional for time-series)
- **Cache/Queue**: Redis (optional)
- **Message Queue**: Kafka (for microservices mode)

### Key Characteristics

- **Multi-tenancy**: Support for multiple tenants and customers
- **Scalable**: Horizontal scaling with microservices architecture
- **Protocol-agnostic**: MQTT, HTTP, CoAP, LwM2M support
- **Rule Engine**: Flexible data processing with visual rule chains
- **Real-time**: WebSocket support for live dashboards
- **Extensible**: Plugin architecture for custom functionality

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Devices │  │ Browsers │  │   APIs   │  │ Gateways │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        │ MQTT/CoAP   │ HTTP/WS     │ REST        │ MQTT
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼──────────┐
│                    Transport Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   MQTT   │  │   HTTP   │  │   CoAP   │  │  LwM2M   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────┐
│                  Application Layer                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Core Services                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │  Device  │  │   User   │  │  Tenant  │          │  │
│  │  │ Service  │  │ Service  │  │ Service  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Rule Engine                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │   Rule   │  │   Node   │  │  Queue   │          │  │
│  │  │  Chain   │  │ Executor │  │ Service  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Data Access Layer                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │   DAO    │  │  Cache   │  │  Search  │          │  │
│  │  │ Services │  │ Service  │  │ Service  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────┬──────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────┐
│                    Persistence Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │PostgreSQL│  │ Cassandra│  │  Redis   │  │  Kafka   │  │
│  │   (SQL)  │  │   (TS)   │  │ (Cache)  │  │ (Queue)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Application Module

**Location**: `/application`

The main Spring Boot application that orchestrates all components.

**Key Classes**:
- `ThingsboardServerApplication.java` - Main entry point
- Configuration classes for Spring Boot setup
- REST API controllers
- WebSocket handlers

### 2. Data Access Object (DAO) Layer

**Location**: `/dao`

Handles all database operations with abstraction over different database types.

**Components**:
- **Entity DAOs**: Device, Asset, Tenant, User, Customer
- **Telemetry DAOs**: Time-series data storage
- **Relation DAOs**: Entity relationship management
- **Audit Log DAOs**: System activity logging

**Key Features**:
- Database abstraction (PostgreSQL, Cassandra)
- Query builders
- Pagination support
- Transaction management

### 3. Common Module

**Location**: `/common`

Shared utilities and models used across all modules.

**Sub-modules**:
- **data**: Data models and DTOs
- **message**: Message queue abstractions
- **transport**: Transport protocol definitions
- **util**: Utility classes

### 4. Rule Engine

**Location**: `/rule-engine`

Process telemetry and events using configurable rule chains.

**Components**:
- **Rule Chain**: Workflow definition
- **Rule Nodes**: Processing units
  - Filter nodes
  - Transformation nodes
  - Action nodes
  - External nodes
- **Message Queue**: Async processing
- **Actor System**: Concurrent execution

**Data Flow**:
```
Device Data → Transport → Rule Chain → Nodes → Actions
                                ↓
                           Database/Alarms/Notifications
```

### 5. Transport Layer

**Location**: `/transport`

Implements device communication protocols.

**Supported Protocols**:
- **MQTT** (`/transport/mqtt`) - IoT standard protocol
- **HTTP** (`/transport/http`) - RESTful API
- **CoAP** (`/transport/coap`) - Constrained devices
- **LwM2M** (`/transport/lwm2m`) - Device management

**Common Flow**:
```
Device → Protocol Handler → Session Management → Core Services
```

### 6. Backend Services

**Location**: `/backend-python`

Python-based backend services for specific functionality.

**Services**:
- Gateway management
- Device simulators
- Custom protocols
- Data processing

### 7. Frontend

**Location**: `/frontend-react` (new), `/ui-ngx` (legacy)

React-based single-page application for user interface.

**Key Features**:
- Dashboard management
- Device management
- Rule chain editor
- User management
- Real-time data visualization

**Tech Stack**:
- React 18
- TypeScript
- Material-UI
- Redux Toolkit
- React Flow (rule chain editor)
- Recharts (visualization)

## Data Flow

### Telemetry Data Flow

```
1. Device sends data via MQTT/HTTP/CoAP
   ↓
2. Transport layer validates and authenticates
   ↓
3. Session manager creates device session
   ↓
4. Data converted to internal format
   ↓
5. Published to rule engine queue
   ↓
6. Rule engine processes through rule chain
   ↓
7. Data saved to database (PostgreSQL/Cassandra)
   ↓
8. Subscriptions notified via WebSocket
   ↓
9. Dashboard updates in real-time
```

### API Request Flow

```
1. Browser sends HTTP request
   ↓
2. Spring Security authenticates
   ↓
3. REST controller receives request
   ↓
4. Service layer processes business logic
   ↓
5. DAO layer queries database
   ↓
6. Response returned to browser
```

### Real-time Updates Flow

```
1. Client subscribes via WebSocket
   ↓
2. Subscription stored in memory
   ↓
3. Data changes trigger events
   ↓
4. WebSocket pushes update to client
   ↓
5. Frontend updates UI
```

## Module Architecture

### Application Module Structure

```
application/
├── src/main/java/
│   └── org/thingsboard/server/
│       ├── actors/              # Actor system
│       ├── controller/          # REST controllers
│       ├── service/             # Business logic
│       │   ├── security/       # Authentication
│       │   ├── telemetry/      # Telemetry processing
│       │   ├── subscription/   # WebSocket subscriptions
│       │   └── ...
│       ├── config/             # Spring configuration
│       └── ThingsboardServerApplication.java
├── src/main/resources/
│   ├── thingsboard.yml         # Main config
│   ├── logback.xml             # Logging config
│   └── application.properties
└── src/main/data/
    ├── json/                   # Demo data
    └── sql/                    # Database migrations
```

### DAO Module Structure

```
dao/
├── src/main/java/
│   └── org/thingsboard/server/dao/
│       ├── device/             # Device DAOs
│       ├── asset/              # Asset DAOs
│       ├── tenant/             # Tenant DAOs
│       ├── user/               # User DAOs
│       ├── timeseries/         # Telemetry DAOs
│       ├── relation/           # Relation DAOs
│       ├── sql/                # SQL implementations
│       ├── nosql/              # Cassandra implementations
│       └── cache/              # Cache layer
```

### Rule Engine Structure

```
rule-engine/
├── src/main/java/
│   └── org/thingsboard/server/
│       ├── actors/             # Actor system
│       │   ├── rulechain/     # Rule chain actors
│       │   └── service/       # Actor services
│       ├── service/
│       │   ├── queue/         # Message queue
│       │   └── script/        # Script execution
│       └── common/
│           └── data/
│               └── plugin/    # Rule node plugins
```

## Database Schema

### Core Entities

```sql
-- Hierarchical structure
tenant
  └── customer
      └── user
      └── device
      └── asset
      └── dashboard

-- Key tables
- tenant                # Multi-tenant isolation
- customer              # Customer management
- user                  # User accounts
- device                # IoT devices
- asset                 # Non-device entities
- alarm                 # Alert management
- rule_chain            # Processing workflows
- dashboard             # UI dashboards
- device_profile        # Device templates
- asset_profile         # Asset templates
- relation              # Entity relationships
```

### Time-Series Data

**PostgreSQL** (default):
- `ts_kv` - Telemetry key-value pairs
- Partitioned by time for performance

**Cassandra** (optional, for scale):
- `ts_kv_cf` - Column family for telemetry
- Time-based partitioning

### Relationships

```
tenant (1) ─────► (N) customer
tenant (1) ─────► (N) device
tenant (1) ─────► (N) user
customer (1) ───► (N) device
customer (1) ───► (N) asset
device (1) ──────► (N) telemetry
device (1) ──────► (N) alarm
```

## Transport Protocols

### MQTT Transport

**Features**:
- QoS 0, 1, 2 support
- SSL/TLS encryption
- Client authentication
- Topic-based routing

**Topics**:
```
v1/devices/me/telemetry         # Send telemetry
v1/devices/me/attributes        # Send attributes
v1/devices/me/attributes/request # Request attributes
v1/devices/me/rpc/request       # RPC request
v1/devices/me/rpc/response      # RPC response
```

### HTTP Transport

**Endpoints**:
```
POST /api/v1/{token}/telemetry        # Send telemetry
POST /api/v1/{token}/attributes       # Send attributes
GET  /api/v1/{token}/attributes       # Get attributes
POST /api/v1/{token}/rpc             # RPC call
```

### CoAP Transport

**Features**:
- Lightweight for constrained devices
- UDP-based protocol
- DTLS security

## Rule Engine

### Architecture

```
┌─────────────────────────────────────┐
│         Rule Chain                  │
│  ┌────┐    ┌────┐    ┌────┐        │
│  │Node│───►│Node│───►│Node│        │
│  └────┘    └────┘    └────┘        │
│     ▲         │         │           │
│     │         ▼         ▼           │
│  ┌────┐    ┌────┐    ┌────┐        │
│  │Node│    │Node│    │Node│        │
│  └────┘    └────┘    └────┘        │
└─────────────────────────────────────┘
```

### Node Types

1. **Filter Nodes**: Filter messages based on conditions
2. **Enrichment Nodes**: Add data from attributes/relations
3. **Transformation Nodes**: Transform message structure
4. **Action Nodes**: Perform actions (save, alarm, RPC)
5. **External Nodes**: Call external systems

### Execution Model

- **Actor-based**: Each rule chain is an actor
- **Asynchronous**: Non-blocking execution
- **Fault-tolerant**: Error handling and retries
- **Scalable**: Distributed processing

## Scalability

### Monolithic Mode

Single application instance - suitable for small to medium deployments.

**Characteristics**:
- Single JVM process
- Embedded queue
- Simple deployment
- Vertical scaling

### Microservices Mode

**Location**: `/msa`

Distributed architecture for large-scale deployments.

**Services**:
- **Core Service**: Entity management
- **Rule Engine Service**: Rule processing
- **Transport Service**: Protocol handling
- **Web UI Service**: Frontend serving
- **JS Executor**: Script execution

**Communication**:
- Kafka for message queue
- gRPC for service-to-service
- Redis for cache

**Benefits**:
- Horizontal scaling
- Fault isolation
- Independent deployment
- Resource optimization

## Security

### Authentication

- **JWT Tokens**: Stateless authentication
- **OAuth2**: Third-party integration
- **X.509 Certificates**: Device authentication
- **Basic Auth**: Legacy support

### Authorization

- **Role-Based Access Control (RBAC)**
  - System Administrator
  - Tenant Administrator
  - Customer User
  - Generic User

### Data Security

- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: TLS/SSL
- **Multi-tenancy Isolation**: Data segregation
- **Audit Logging**: Activity tracking

### Device Security

- **Access Tokens**: Per-device tokens
- **Credentials**: Username/password
- **Certificates**: X.509 authentication
- **Rate Limiting**: DoS protection

## Extension Points

### Custom Rule Nodes

Implement `TbNode` interface:

```java
@RuleNode(
    type = ComponentType.ENRICHMENT,
    name = "custom node",
    configClazz = CustomNodeConfiguration.class,
    nodeDescription = "Description",
    nodeDetails = "Details"
)
public class CustomNode implements TbNode {
    @Override
    public void init(TbContext ctx, TbNodeConfiguration configuration) {
        // Initialize
    }

    @Override
    public void onMsg(TbContext ctx, TbMsg msg) {
        // Process message
    }
}
```

### Custom Widgets

Add custom dashboard widgets in frontend:

```typescript
export const customWidget: WidgetType = {
  name: 'custom-widget',
  icon: 'icon',
  component: CustomWidgetComponent,
  // Configuration
};
```

### Custom Transport

Implement transport protocol:

```java
public interface TransportService {
    void process(TransportProtos.SessionInfoProto sessionInfo,
                 TransportProtos.PostTelemetryMsg msg,
                 TransportServiceCallback<Void> callback);
}
```

## Performance Considerations

### Database Optimization

- Use PostgreSQL for metadata
- Consider Cassandra for high-volume telemetry
- Enable Redis caching
- Partition time-series tables

### Application Tuning

- Adjust actor system thread pools
- Configure queue sizes
- Tune JVM heap size
- Enable connection pooling

### Network Optimization

- Use MQTT for device communication
- Enable WebSocket compression
- Configure CDN for frontend
- Load balance transport layer

## Monitoring

- **Metrics**: Prometheus integration
- **Logging**: ELK stack compatible
- **Tracing**: Distributed tracing support
- **Health Checks**: Spring Boot Actuator

## Additional Resources

- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Official Docs**: https://thingsboard.io/docs/
- **Development Guide**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

Last updated: 2025-11-17
