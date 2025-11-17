# Application Module

The main Spring Boot application module that orchestrates all ThingsBoard components.

## Overview

This module contains the main entry point for the ThingsBoard server and integrates all other modules (DAO, Rule Engine, Transports) into a single runnable application.

## Structure

```
application/
├── src/main/java/
│   └── org/thingsboard/server/
│       ├── ThingsboardServerApplication.java  # Main entry point
│       ├── actors/                            # Actor system
│       ├── config/                            # Spring configuration
│       ├── controller/                        # REST API controllers
│       │   ├── AlarmController.java
│       │   ├── AssetController.java
│       │   ├── DeviceController.java
│       │   ├── TelemetryController.java
│       │   └── ...
│       ├── service/                           # Business logic services
│       │   ├── security/                      # Authentication & authorization
│       │   ├── telemetry/                     # Telemetry processing
│       │   ├── subscription/                  # WebSocket subscriptions
│       │   ├── install/                       # Installation services
│       │   └── ...
│       └── ws/                                # WebSocket handlers
├── src/main/resources/
│   ├── thingsboard.yml                        # Main configuration
│   ├── application.properties                 # Spring Boot properties
│   ├── logback.xml                            # Logging configuration
│   └── ...
├── src/main/data/
│   ├── json/                                  # Demo data
│   │   ├── system/                           # System data
│   │   ├── demo/                             # Demo tenant data
│   │   └── edge/                             # Edge installation scripts
│   └── sql/                                   # Database migrations
│       ├── schema-entities.sql
│       ├── schema-timeseries.sql
│       └── upgrade/                          # Upgrade scripts
└── pom.xml
```

## Key Components

### 1. Main Application

**File**: `ThingsboardServerApplication.java`

The main entry point that starts the Spring Boot application.

```java
@SpringBootApplication
public class ThingsboardServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ThingsboardServerApplication.class, args);
    }
}
```

### 2. REST API Controllers

Located in `controller/` package. Implements the ThingsBoard REST API.

**Key Controllers**:
- **DeviceController** - Device management (CRUD operations)
- **AssetController** - Asset management
- **TelemetryController** - Telemetry and attributes API
- **AlarmController** - Alarm management
- **DashboardController** - Dashboard operations
- **RuleChainController** - Rule chain management
- **UserController** - User management
- **CustomerController** - Customer management

**Example** (DeviceController.java:245):
```java
@RestController
@RequestMapping("/api")
public class DeviceController extends BaseController {

    @PostMapping("/device")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    public Device saveDevice(@RequestBody Device device) {
        // Device creation logic
    }

    @GetMapping("/device/{deviceId}")
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    public Device getDeviceById(@PathVariable String deviceId) {
        // Get device logic
    }
}
```

### 3. Services

Located in `service/` package. Contains business logic.

**Key Service Packages**:

- **security/** - Authentication and authorization
  - `UserService.java` - User management
  - `AuthenticationService.java` - Login/logout
  - `JwtTokenService.java` - JWT token handling

- **telemetry/** - Telemetry processing
  - `TelemetryService.java` - Save and query telemetry
  - `AttributeService.java` - Attribute management

- **subscription/** - WebSocket subscriptions
  - `SubscriptionService.java` - Real-time data subscriptions

- **install/** - Installation and upgrades
  - `InstallService.java` - Schema installation
  - `UpgradeService.java` - Database migrations

### 4. Configuration

**thingsboard.yml** - Main application configuration

Key sections:
```yaml
# Server configuration
server:
  port: 8080
  address: 0.0.0.0

# Database configuration
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/thingsboard
    username: thingsboard
    password: thingsboard

# Redis configuration (optional)
redis:
  connection:
    type: standalone
  standalone:
    host: localhost
    port: 6379

# Transport configuration
transport:
  http:
    enabled: true
  mqtt:
    enabled: true
    bind_port: 1883
  coap:
    enabled: true
    bind_port: 5683

# Actor system configuration
actors:
  system:
    throughput: 5
  tenant:
    create_components_on_init: true
```

### 5. Actor System

Located in `actors/` package. Implements the actor-based processing model.

**Key Actors**:
- **TenantActor** - Per-tenant actor
- **DeviceActor** - Per-device processing
- **RuleChainActor** - Rule chain execution
- **AppActor** - Application-level actor

### 6. WebSocket Support

Located in `ws/` package. Handles real-time WebSocket connections.

**Components**:
- **WebSocketService** - WebSocket session management
- **TelemetryWebSocketHandler** - Telemetry subscriptions
- **CmdHandler** - Command processing

## Building

### Full Build

```bash
mvn clean install
```

### Skip Tests

```bash
mvn clean install -DskipTests
```

### Build Only Application

```bash
cd application
mvn clean package
```

## Running

### From JAR

```bash
java -jar application/target/thingsboard-*.jar
```

### From Maven

```bash
cd application
mvn spring-boot:run
```

### With Custom Configuration

```bash
java -jar application/target/thingsboard-*.jar \
  --spring.config.location=/path/to/thingsboard.yml
```

### Development Mode

```bash
cd application
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

## Installation

### Install Schema

First-time installation to create database schema:

```bash
java -cp application/target/thingsboard-*.jar \
  org.thingsboard.server.ThingsboardInstallApplication \
  --install
```

### Upgrade Schema

Upgrade existing installation:

```bash
java -cp application/target/thingsboard-*.jar \
  org.thingsboard.server.ThingsboardInstallApplication \
  --upgrade
```

### Load Demo Data

Install with demo data:

```bash
java -cp application/target/thingsboard-*.jar \
  org.thingsboard.server.ThingsboardInstallApplication \
  --install \
  --loadDemo
```

## Configuration

### Database

PostgreSQL (default):
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/thingsboard
    username: thingsboard
    password: thingsboard
```

### JVM Options

For production deployment:

```bash
export JAVA_OPTS="-Xms2G -Xmx4G -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### Environment Variables

Common environment variables:

```bash
# Database
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/thingsboard
export SPRING_DATASOURCE_USERNAME=thingsboard
export SPRING_DATASOURCE_PASSWORD=password

# Server
export HTTP_BIND_PORT=8080

# Redis
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

## API Documentation

Once running, access:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs

## Testing

### Run All Tests

```bash
cd application
mvn test
```

### Run Specific Test

```bash
mvn test -Dtest=DeviceControllerTest
```

### Integration Tests

```bash
mvn verify -P integration-tests
```

## Default Credentials

After installation:

- **System Admin**
  - Email: `sysadmin@thingsboard.org`
  - Password: `sysadmin`

- **Tenant Admin** (if demo data loaded)
  - Email: `tenant@thingsboard.org`
  - Password: `tenant`

**IMPORTANT**: Change these passwords in production!

## Logging

### Log Configuration

Edit `src/main/resources/logback.xml`:

```xml
<logger name="org.thingsboard" level="INFO"/>
<logger name="org.thingsboard.server.dao" level="DEBUG"/>
```

### Log Files

Default location: `/var/log/thingsboard/thingsboard.log`

### Enable Debug Logging

```bash
java -jar application/target/thingsboard-*.jar \
  --logging.level.org.thingsboard=DEBUG
```

## Monitoring

### Spring Boot Actuator

Endpoints available at `/actuator`:

- `/actuator/health` - Health check
- `/actuator/metrics` - Application metrics
- `/actuator/prometheus` - Prometheus metrics

### JMX Monitoring

Enable JMX:

```bash
java -Dcom.sun.management.jmxremote \
  -Dcom.sun.management.jmxremote.port=9010 \
  -Dcom.sun.management.jmxremote.local.only=false \
  -Dcom.sun.management.jmxremote.authenticate=false \
  -jar application/target/thingsboard-*.jar
```

## Debugging

### Remote Debugging

```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 \
  -jar application/target/thingsboard-*.jar
```

Connect debugger to port 5005.

### IDE Debugging

**IntelliJ IDEA**:
1. Open project
2. Navigate to `ThingsboardServerApplication.java`
3. Right-click → Debug

## Dependencies

Key dependencies:
- Spring Boot 3.4.10
- Spring Security
- Spring Data JPA
- PostgreSQL Driver
- Cassandra Driver (optional)
- Redis Jedis
- Jackson (JSON)
- Swagger (API docs)

See `pom.xml` for complete list.

## Related Modules

- **DAO Module** - Data access layer ([../dao/README.md](../dao/README.md))
- **Rule Engine** - Data processing ([../rule-engine/README.md](../rule-engine/README.md))
- **Transport** - Device protocols ([../transport/](../transport/))
- **Common** - Shared utilities ([../common/](../common/))

## Additional Resources

- [Development Guide](../DEVELOPMENT.md)
- [API Guide](../API_GUIDE.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

---

Last updated: 2025-11-17
