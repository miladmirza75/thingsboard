# Rule Engine Module

The Rule Engine processes incoming messages from devices and executes configurable workflows (Rule Chains).

## Overview

The Rule Engine is the core data processing component of ThingsBoard. It allows you to create complex workflows using a visual drag-and-drop interface, process telemetry data, generate alarms, send notifications, and integrate with external systems.

## Structure

```
rule-engine/
├── rule-engine-api/              # Rule engine API and interfaces
│   └── src/main/java/
│       └── org/thingsboard/rule/engine/api/
│           ├── TbNode.java       # Rule node interface
│           ├── TbContext.java    # Execution context
│           └── ...
├── rule-engine-components/        # Built-in rule nodes
│   └── src/main/java/
│       └── org/thingsboard/rule/engine/
│           ├── action/           # Action nodes
│           ├── filter/           # Filter nodes
│           ├── transform/        # Transformation nodes
│           ├── enrichment/       # Enrichment nodes
│           ├── external/         # External system nodes
│           ├── flow/             # Flow control nodes
│           └── ...
└── pom.xml
```

## Key Concepts

### 1. Rule Chain

A **Rule Chain** is a workflow that defines how messages are processed.

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

### 2. Rule Node

A **Rule Node** is a processing unit in a rule chain.

**Types of Nodes**:
- **Filter Nodes** - Filter messages based on conditions
- **Enrichment Nodes** - Add data from attributes/relations
- **Transformation Nodes** - Transform message format
- **Action Nodes** - Perform actions (save, alarm, RPC)
- **External Nodes** - Call external systems
- **Flow Control Nodes** - Control message flow

### 3. Message Flow

```
Device Telemetry
      ↓
Rule Chain Input
      ↓
Node 1 (Filter) → Success → Node 2 (Transform)
      ↓                            ↓
   Failure                    Node 3 (Save)
      ↓                            ↓
  Log Error                   Database
```

### 4. Actor System

The Rule Engine uses an actor-based model for concurrent processing:

```
TenantActor
    ├── RuleChainActor (Chain 1)
    │   ├── RuleNodeActor (Node 1)
    │   ├── RuleNodeActor (Node 2)
    │   └── RuleNodeActor (Node 3)
    └── RuleChainActor (Chain 2)
        └── ...
```

## Built-in Rule Nodes

### Filter Nodes

#### Script Filter Node

Filters messages using JavaScript:

```javascript
// Example filter
return msg.temperature > 25;
```

#### Message Type Filter

Filters by message type:
- Post telemetry
- Post attributes
- RPC Request
- Activity Event
- Inactivity Event

#### Switch Node

Routes messages based on JavaScript conditions:

```javascript
// Route based on temperature
if (msg.temperature < 0) {
    return ['Cold'];
} else if (msg.temperature < 20) {
    return ['Normal'];
} else {
    return ['Hot'];
}
```

### Enrichment Nodes

#### Originator Attributes

Adds device/asset attributes to message:

```json
{
  "temperature": 25,
  "model": "DHT22",        // Added from device attributes
  "location": "Room A"     // Added from device attributes
}
```

#### Originator Telemetry

Adds latest telemetry values to message.

#### Related Entity Attributes

Adds attributes from related entities:
- Customer attributes
- Asset attributes
- Parent entity attributes

### Transformation Nodes

#### Script Transformation Node

Transforms message using JavaScript:

```javascript
// Convert temperature from Celsius to Fahrenheit
var newMsg = {
    temperature: msg.temperature * 9/5 + 32,
    humidity: msg.humidity
};
return {msg: newMsg, metadata: metadata, msgType: msgType};
```

#### To Email Node

Converts message to email format.

#### Change Originator

Changes message originator to another entity.

### Action Nodes

#### Save Timeseries

Saves telemetry to database:

```java
@RuleNode(
    type = ComponentType.ACTION,
    name = "save timeseries",
    configClazz = TbMsgConfiguration.class,
    nodeDescription = "Saves timeseries data",
    nodeDetails = "Saves time-series data to the database"
)
public class TbMsgSaveTimeseriesNode implements TbNode {
    @Override
    public void onMsg(TbContext ctx, TbMsg msg) {
        ctx.getTelemetryService().saveAndNotify(
            ctx.getTenantId(),
            msg.getOriginator(),
            toTsKvEntryList(msg.getData()),
            new TelemetryNodeCallback(ctx, msg)
        );
    }
}
```

#### Save Attributes

Saves attributes to database.

#### Create Alarm Node

Creates or updates alarms:

```javascript
// Alarm configuration
{
  "alarmType": "High Temperature",
  "severity": "CRITICAL",
  "propagate": true,
  "alarmDetails": "Temperature is ${temperature}"
}
```

#### Clear Alarm Node

Clears existing alarms.

#### RPC Call Request

Sends RPC request to device.

### External Nodes

#### REST API Call

Calls external REST API:

```json
{
  "endpoint": "https://api.example.com/data",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token"
  }
}
```

#### Send Email

Sends email notifications:

```
To: admin@example.com
Subject: High Temperature Alert
Body: Device ${deviceName} reports temperature ${temperature}°C
```

#### Kafka Node

Publishes message to Kafka topic.

#### MQTT Node

Publishes message to external MQTT broker.

### Flow Control Nodes

#### Checkpoint

Creates checkpoint for message flow.

#### Delay Node

Delays message processing.

#### Generator Node

Generates periodic messages.

#### Log Node

Logs message to console/file:

```javascript
// Log script
return "Temperature: " + msg.temperature + ", Device: " + metadata.deviceName;
```

## Creating Custom Rule Nodes

### 1. Implement TbNode Interface

```java
@RuleNode(
    type = ComponentType.ENRICHMENT,
    name = "custom enrichment",
    configClazz = CustomNodeConfiguration.class,
    nodeDescription = "Custom enrichment node",
    nodeDetails = "Adds custom data to messages"
)
@Component
public class CustomEnrichmentNode implements TbNode {

    private CustomNodeConfiguration config;

    @Override
    public void init(TbContext ctx, TbNodeConfiguration configuration)
            throws TbNodeException {
        this.config = TbNodeUtils.convert(configuration,
                                          CustomNodeConfiguration.class);
    }

    @Override
    public void onMsg(TbContext ctx, TbMsg msg) throws ExecutionException {
        // Process message
        JsonNode data = JacksonUtil.toJsonNode(msg.getData());

        // Add custom field
        ((ObjectNode) data).put("customField", "customValue");

        // Create new message
        TbMsg newMsg = TbMsg.transformMsg(msg, msg.getType(),
                                          msg.getOriginator(),
                                          msg.getMetaData(),
                                          JacksonUtil.toString(data));

        // Tell next nodes
        ctx.tellNext(newMsg, "Success");
    }

    @Override
    public void destroy() {
        // Cleanup
    }
}
```

### 2. Configuration Class

```java
@Data
public class CustomNodeConfiguration implements NodeConfiguration<CustomNodeConfiguration> {

    private String customParam;
    private int timeout;

    @Override
    public CustomNodeConfiguration defaultConfiguration() {
        CustomNodeConfiguration config = new CustomNodeConfiguration();
        config.setCustomParam("default");
        config.setTimeout(5000);
        return config;
    }
}
```

### 3. Register Node

Add `@Component` annotation and the node will be auto-discovered.

### 4. Use in Rule Chain

1. Open Rule Chain editor
2. Find your custom node in the node library
3. Drag to canvas and configure
4. Connect to other nodes

## Rule Engine API

### TbContext

Context provided to rule nodes:

```java
public interface TbContext {
    // Tenant ID
    TenantId getTenantId();

    // Tell next nodes
    void tellNext(TbMsg msg, String relationType);
    void tellNext(TbMsg msg, Set<String> relationTypes);

    // Services
    TelemetryService getTelemetryService();
    DeviceService getDeviceService();
    AssetService getAssetService();

    // Script execution
    ListenableFuture<TbMsg> executeScript(String script, TbMsg msg);

    // External calls
    ListenableFuture<String> getExternalApiCallResult(String url);
}
```

### TbMsg

Message object passed between nodes:

```java
public final class TbMsg {
    private final UUID id;
    private final String type;
    private final EntityId originator;
    private final TbMsgMetaData metaData;
    private final String data;

    // Get message data as JsonNode
    public JsonNode getDataAsJson() {
        return JacksonUtil.toJsonNode(data);
    }

    // Transform message
    public static TbMsg transformMsg(TbMsg msg, String type,
                                      EntityId originator,
                                      TbMsgMetaData metaData,
                                      String data) {
        // Creates new message
    }
}
```

### TbMsgMetaData

Message metadata:

```java
public class TbMsgMetaData {
    private final Map<String, String> data;

    public String getValue(String key) {
        return data.get(key);
    }

    public void putValue(String key, String value) {
        data.put(key, value);
    }
}
```

## Script Execution

### JavaScript Functions

Available functions in script nodes:

```javascript
// Message data
msg.temperature
msg.humidity

// Metadata
metadata.deviceName
metadata.deviceType

// Message type
msgType  // "POST_TELEMETRY_REQUEST"

// JSON utilities
JSON.parse(str)
JSON.stringify(obj)

// Math functions
Math.random()
Math.floor(x)
Math.ceil(x)

// Date functions
new Date()
Date.now()
```

### Script Examples

**Filter by temperature:**

```javascript
return msg.temperature > 25 && msg.temperature < 100;
```

**Transform data:**

```javascript
var newMsg = {
    temp_f: msg.temperature * 9/5 + 32,
    temp_c: msg.temperature,
    humidity: msg.humidity,
    timestamp: Date.now()
};
return {msg: newMsg, metadata: metadata, msgType: msgType};
```

**Switch routing:**

```javascript
if (msg.batteryLevel < 20) {
    return ['Low Battery'];
} else if (msg.batteryLevel < 50) {
    return ['Medium Battery'];
} else {
    return ['Good Battery'];
}
```

## Message Queue

### Queue Configuration

```yaml
queue:
  type: kafka  # or in-memory, rabbitmq, aws-sqs
  kafka:
    bootstrap.servers: localhost:9092
    acks: all
    retries: 1
    batch.size: 16384
```

### Queue Processing

Messages flow through queues:

```
Device → Transport → Queue → Rule Engine → Queue → Database
```

### Partitioning

Messages are partitioned by tenant and entity ID for parallel processing.

## Performance Tuning

### Actor System Configuration

```yaml
actors:
  system:
    throughput: 5
    scheduler_pool_size: 4
  tenant:
    create_components_on_init: true
  rule:
    thread_pool_size: 8
    max_errors_before_rate_limits: 200
```

### Script Execution

```yaml
js:
  evaluator: local  # or remote
  max_total_args_size: 100000
  max_requests_timeout: 10000
```

### Queue Configuration

```yaml
queue:
  core:
    topic: tb_core
    poll-interval: 25
    partitions: 10
    pack-processing-timeout: 2000
  rule-engine:
    topic: tb_rule_engine
    poll-interval: 25
    partitions: 10
```

## Testing

### Unit Test Rule Node

```java
@ExtendWith(MockitoExtension.class)
public class CustomNodeTest {

    @Mock
    private TbContext ctx;

    private CustomEnrichmentNode node;
    private TbNodeConfiguration config;

    @BeforeEach
    public void setUp() {
        node = new CustomEnrichmentNode();
        config = new TbNodeConfiguration(
            JacksonUtil.valueToTree(new CustomNodeConfiguration())
        );
    }

    @Test
    public void testEnrichment() throws Exception {
        node.init(ctx, config);

        TbMsg msg = TbMsg.newMsg("POST_TELEMETRY_REQUEST",
                                 DeviceId.fromString("..."),
                                 new TbMsgMetaData(),
                                 "{\"temperature\":25}");

        node.onMsg(ctx, msg);

        ArgumentCaptor<TbMsg> captor = ArgumentCaptor.forClass(TbMsg.class);
        verify(ctx).tellNext(captor.capture(), eq("Success"));

        TbMsg resultMsg = captor.getValue();
        JsonNode data = resultMsg.getDataAsJson();

        assertEquals("customValue", data.get("customField").asText());
    }
}
```

### Integration Test

```java
@SpringBootTest
public class RuleChainIntegrationTest {

    @Autowired
    private RuleChainService ruleChainService;

    @Test
    public void testRuleChainExecution() {
        // Create test rule chain
        // Send test message
        // Verify output
    }
}
```

## Debugging

### Enable Debug Logging

```xml
<!-- logback.xml -->
<logger name="org.thingsboard.server.actors" level="DEBUG"/>
<logger name="org.thingsboard.rule.engine" level="DEBUG"/>
```

### Log Node

Add Log nodes to rule chain to debug message flow:

```javascript
// Log script
return "Msg: " + JSON.stringify(msg) +
       ", Metadata: " + JSON.stringify(metadata);
```

### Monitor Rule Chain

Use Rule Chain statistics in UI:
- Messages processed
- Errors
- Processing time

## Building

```bash
# Build rule engine
mvn clean install

# Skip tests
mvn clean install -DskipTests

# Build only rule-engine
cd rule-engine
mvn clean package
```

## Related Modules

- **Application Module** - Main application ([../application/README.md](../application/README.md))
- **DAO Module** - Data access ([../dao/README.md](../dao/README.md))
- **Common Module** - Data models ([../common/](../common/))

## Additional Resources

- [Official Rule Engine Docs](https://thingsboard.io/docs/user-guide/rule-engine-2-0/re-getting-started/)
- [Architecture Overview](../ARCHITECTURE.md)
- [Development Guide](../DEVELOPMENT.md)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

---

Last updated: 2025-11-17
