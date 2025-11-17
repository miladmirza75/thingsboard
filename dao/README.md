# DAO (Data Access Object) Module

Data Access Layer for ThingsBoard, providing database abstraction and entity management.

## Overview

The DAO module handles all database operations in ThingsBoard, providing a clean abstraction over different database types (PostgreSQL, Cassandra) and entity types (Device, Asset, User, Telemetry, etc.).

## Structure

```
dao/
├── src/main/java/
│   └── org/thingsboard/server/dao/
│       ├── asset/                    # Asset DAOs
│       ├── audit/                    # Audit log DAOs
│       ├── alarm/                    # Alarm DAOs
│       ├── attributes/               # Attribute DAOs
│       ├── customer/                 # Customer DAOs
│       ├── dashboard/                # Dashboard DAOs
│       ├── device/                   # Device DAOs
│       ├── deviceprofile/            # Device profile DAOs
│       ├── relation/                 # Entity relation DAOs
│       ├── rule/                     # Rule chain DAOs
│       ├── settings/                 # Settings DAOs
│       ├── tenant/                   # Tenant DAOs
│       ├── timeseries/               # Time-series (telemetry) DAOs
│       ├── user/                     # User DAOs
│       ├── sql/                      # SQL implementations
│       │   ├── device/
│       │   ├── timeseries/
│       │   └── ...
│       ├── nosql/                    # NoSQL (Cassandra) implementations
│       │   └── timeseries/
│       ├── cache/                    # Caching layer
│       ├── model/                    # Data models
│       ├── service/                  # Service interfaces
│       ├── util/                     # Utilities
│       └── DaoConfig.java            # DAO configuration
└── pom.xml
```

## Key Concepts

### 1. DAO Pattern

The module follows the Data Access Object pattern:

```
Service Layer
     ↓
DAO Interface (e.g., DeviceDao)
     ↓
DAO Implementation (e.g., DeviceDaoImpl)
     ↓
JPA Repository / CQL Queries
     ↓
Database (PostgreSQL / Cassandra)
```

### 2. Database Support

**PostgreSQL** (default):
- Metadata storage (devices, users, tenants, etc.)
- Time-series data (telemetry)
- Full-text search
- ACID transactions

**Cassandra** (optional):
- High-volume time-series data
- Horizontal scalability
- Optimized for writes

### 3. Multi-tenancy

All entities are isolated by tenant:

```java
@Entity
@Table(name = "device")
public class Device {
    @Id
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;  // Tenant isolation

    // Other fields...
}
```

## Core Components

### 1. Entity DAOs

#### Device DAO

**Interface**: `DeviceDao.java`
**Implementation**: `DeviceDaoImpl.java` (SQL)

```java
public interface DeviceDao extends Dao<Device> {
    Device findByTenantIdAndName(UUID tenantId, String name);
    PageData<Device> findDevicesByTenantId(UUID tenantId, PageLink pageLink);
    PageData<DeviceInfo> findDeviceInfosByTenantId(UUID tenantId, PageLink pageLink);
    List<Device> findDevicesByTenantIdAndType(UUID tenantId, String type);
}
```

**Usage Example**:

```java
@Service
public class DeviceService {
    @Autowired
    private DeviceDao deviceDao;

    public Device createDevice(Device device) {
        // Validation
        if (device.getTenantId() == null) {
            throw new DataValidationException("Tenant id is required!");
        }

        // Save to database
        return deviceDao.save(device.getTenantId(), device);
    }

    public Device findDeviceByTenantIdAndName(UUID tenantId, String name) {
        return deviceDao.findByTenantIdAndName(tenantId, name);
    }
}
```

#### Asset DAO

**Interface**: `AssetDao.java`

Manages asset entities (non-device IoT entities).

```java
public interface AssetDao extends Dao<Asset> {
    PageData<Asset> findAssetsByTenantId(UUID tenantId, PageLink pageLink);
    List<Asset> findAssetsByTenantIdAndType(UUID tenantId, String type);
}
```

#### User DAO

**Interface**: `UserDao.java`

Manages user accounts and credentials.

```java
public interface UserDao extends Dao<User> {
    User findByEmail(TenantId tenantId, String email);
    PageData<User> findByTenantId(UUID tenantId, PageLink pageLink);
    PageData<User> findCustomerUsers(UUID tenantId, UUID customerId, PageLink pageLink);
}
```

### 2. Time-Series DAO

**Interface**: `TimeseriesDao.java`

Handles telemetry data storage and retrieval.

**Key Operations**:

```java
public interface TimeseriesDao {
    // Save telemetry
    ListenableFuture<Void> save(TenantId tenantId, EntityId entityId,
                                 TsKvEntry tsKvEntry, long ttl);

    // Get latest values
    ListenableFuture<List<TsKvEntry>> findLatest(TenantId tenantId,
                                                  EntityId entityId,
                                                  Collection<String> keys);

    // Get time range
    ListenableFuture<List<TsKvEntry>> findAllAsync(TenantId tenantId,
                                                    EntityId entityId,
                                                    ReadTsKvQuery query);

    // Delete telemetry
    ListenableFuture<Void> remove(TenantId tenantId, EntityId entityId,
                                   DeleteTsKvQuery query);
}
```

**SQL Implementation** (`SqlTimeseriesDao.java`):

```java
@Repository
public class SqlTimeseriesDao implements TimeseriesDao {

    @Autowired
    private TsKvRepository tsKvRepository;

    @Override
    public ListenableFuture<Void> save(TenantId tenantId, EntityId entityId,
                                        TsKvEntry tsKvEntry, long ttl) {
        TsKvEntity entity = new TsKvEntity();
        entity.setEntityId(entityId.getId());
        entity.setTs(tsKvEntry.getTs());
        entity.setKey(tsKvEntry.getKey());
        entity.setValue(tsKvEntry.getValue());

        return service.submit(() -> {
            tsKvRepository.save(entity);
            return null;
        });
    }

    @Override
    public ListenableFuture<List<TsKvEntry>> findLatest(TenantId tenantId,
                                                         EntityId entityId,
                                                         Collection<String> keys) {
        return service.submit(() -> {
            List<TsKvEntity> entities = tsKvRepository
                .findLatestByEntityIdAndKeys(entityId.getId(), keys);
            return entities.stream()
                .map(this::toTsKvEntry)
                .collect(Collectors.toList());
        });
    }
}
```

### 3. Attributes DAO

**Interface**: `AttributesDao.java`

Manages entity attributes (client-side, server-side, shared).

```java
public interface AttributesDao {
    ListenableFuture<Optional<AttributeKvEntry>> find(TenantId tenantId,
                                                       EntityId entityId,
                                                       String scope,
                                                       String key);

    ListenableFuture<List<AttributeKvEntry>> find(TenantId tenantId,
                                                   EntityId entityId,
                                                   String scope,
                                                   Collection<String> keys);

    ListenableFuture<List<AttributeKvEntry>> findAll(TenantId tenantId,
                                                      EntityId entityId,
                                                      String scope);

    ListenableFuture<List<String>> save(TenantId tenantId, EntityId entityId,
                                         String scope,
                                         List<AttributeKvEntry> attributes);
}
```

**Attribute Scopes**:
- **CLIENT_SCOPE** - Attributes set by device
- **SERVER_SCOPE** - Attributes set by server
- **SHARED_SCOPE** - Attributes shared with device

### 4. Relation DAO

**Interface**: `RelationDao.java`

Manages relationships between entities.

```java
public interface RelationDao {
    ListenableFuture<List<EntityRelation>> findAllByFrom(TenantId tenantId,
                                                          EntityId from,
                                                          RelationTypeGroup typeGroup);

    ListenableFuture<List<EntityRelation>> findAllByTo(TenantId tenantId,
                                                        EntityId to,
                                                        RelationTypeGroup typeGroup);

    ListenableFuture<Boolean> saveRelation(TenantId tenantId,
                                            EntityRelation relation);

    ListenableFuture<Boolean> deleteRelation(TenantId tenantId,
                                              EntityRelation relation);
}
```

**Example Relations**:
```
Device → Contains → Asset
Customer → Manages → Device
Dashboard → Created By → User
```

### 5. Alarm DAO

**Interface**: `AlarmDao.java`

Manages device alarms and events.

```java
public interface AlarmDao extends Dao<AlarmInfo> {
    ListenableFuture<Alarm> findLatestByOriginatorAndType(TenantId tenantId,
                                                           EntityId originator,
                                                           String type);

    PageData<AlarmInfo> findAlarms(TenantId tenantId, AlarmQuery query);

    ListenableFuture<Alarm> createOrUpdateAlarm(Alarm alarm);
}
```

## Database Configuration

### PostgreSQL Configuration

**pom.xml**:
```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

**application.yml**:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/thingsboard
    username: thingsboard
    password: thingsboard
    hikari:
      maximum-pool-size: 20
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: none
    database-platform: org.hibernate.dialect.PostgreSQLDialect
```

### Cassandra Configuration (Optional)

**application.yml**:
```yaml
cassandra:
  cluster_name: Thingsboard Cluster
  keyspace_name: thingsboard
  url: 127.0.0.1:9042
  compression: LZ4
  init_timeout: 30000
```

## Caching Layer

**Location**: `cache/` package

Provides caching for frequently accessed entities.

**Cache Configuration**:

```java
@Configuration
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        return new CaffeineCacheManager(
            "devices",
            "users",
            "tenants",
            "attributes"
        );
    }
}
```

**Usage**:

```java
@Cacheable(value = "devices", key = "#deviceId")
public Device findDeviceById(UUID deviceId) {
    return deviceDao.findById(deviceId);
}

@CacheEvict(value = "devices", key = "#device.id")
public Device saveDevice(Device device) {
    return deviceDao.save(device);
}
```

## Pagination

All list queries support pagination using `PageLink`:

```java
public PageData<Device> findDevices(UUID tenantId, int page, int pageSize) {
    PageLink pageLink = new PageLink(pageSize, page);
    return deviceDao.findDevicesByTenantId(tenantId, pageLink);
}
```

**PageLink Fields**:
- `pageSize` - Number of items per page
- `page` - Page number (0-indexed)
- `textSearch` - Optional search text
- `sortOrder` - Optional sorting

## Transactions

Transactions are managed using Spring's `@Transactional`:

```java
@Service
public class DeviceService {

    @Transactional
    public Device createDeviceWithRelation(Device device, EntityId relatedEntity) {
        // Save device
        Device savedDevice = deviceDao.save(device);

        // Create relation
        EntityRelation relation = new EntityRelation();
        relation.setFrom(device.getId());
        relation.setTo(relatedEntity);
        relation.setType("Contains");
        relationDao.saveRelation(relation);

        return savedDevice;
    }
}
```

## Data Validation

Entities are validated before persistence:

```java
public class Device extends BaseData<DeviceId> implements HasName, HasTenantId {

    @Override
    public void validate() {
        if (tenantId == null) {
            throw new DataValidationException("Tenant id is required!");
        }
        if (StringUtils.isEmpty(name)) {
            throw new DataValidationException("Device name is required!");
        }
        if (name.length() > 255) {
            throw new DataValidationException("Name length exceeds limit!");
        }
    }
}
```

## Query Optimization

### Indexes

Key indexes for performance:

```sql
-- Device indexes
CREATE INDEX idx_device_tenant_id ON device(tenant_id);
CREATE INDEX idx_device_customer_id ON device(customer_id);
CREATE INDEX idx_device_name ON device(name);
CREATE INDEX idx_device_type ON device(type);

-- Time-series indexes
CREATE INDEX idx_ts_kv_entity_id ON ts_kv(entity_id);
CREATE INDEX idx_ts_kv_key ON ts_kv(key);
CREATE INDEX idx_ts_kv_ts ON ts_kv(ts DESC);

-- Composite indexes
CREATE INDEX idx_ts_kv_entity_key_ts ON ts_kv(entity_id, key, ts DESC);
```

### Batch Operations

Use batch operations for bulk inserts:

```java
public void saveMultipleTelemetry(TenantId tenantId, EntityId entityId,
                                   List<TsKvEntry> entries) {
    List<TsKvEntity> entities = entries.stream()
        .map(entry -> toEntity(entityId, entry))
        .collect(Collectors.toList());

    tsKvRepository.saveAll(entities);
}
```

## Testing

### Unit Tests

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class DeviceDaoTest {

    @Autowired
    private DeviceDao deviceDao;

    @Test
    public void testSaveDevice() {
        Device device = new Device();
        device.setTenantId(tenantId);
        device.setName("Test Device");
        device.setType("sensor");

        Device saved = deviceDao.save(tenantId, device);

        assertNotNull(saved.getId());
        assertEquals("Test Device", saved.getName());
    }
}
```

### Integration Tests

```bash
mvn test -Dtest=DeviceDaoIntegrationTest
```

## Building

```bash
# Build DAO module
mvn clean install

# Skip tests
mvn clean install -DskipTests

# Build only DAO
cd dao
mvn clean package
```

## Performance Tuning

### Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### JPA Optimization

```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
        generate_statistics: false
```

### Cassandra Tuning

```yaml
cassandra:
  query:
    buffer_size: 200000
    concurrent_limit: 1000
  read_consistency_level: ONE
  write_consistency_level: ONE
```

## Monitoring

Monitor DAO performance using:

- **SQL Logging**: Enable in logback.xml
- **JPA Statistics**: Hibernate statistics
- **Database Metrics**: Connection pool metrics
- **Query Performance**: Slow query logs

```xml
<!-- logback.xml -->
<logger name="org.thingsboard.server.dao" level="DEBUG"/>
<logger name="org.hibernate.SQL" level="DEBUG"/>
<logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="TRACE"/>
```

## Related Modules

- **Application Module** - Main application ([../application/README.md](../application/README.md))
- **Common Module** - Data models ([../common/](../common/))
- **Rule Engine** - Data processing ([../rule-engine/README.md](../rule-engine/README.md))

## Additional Resources

- [Development Guide](../DEVELOPMENT.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Database Schema](../application/src/main/data/sql/)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

---

Last updated: 2025-11-17
