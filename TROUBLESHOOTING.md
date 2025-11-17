# Troubleshooting Guide

Common issues and solutions for ThingsBoard development and deployment.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [Build Issues](#build-issues)
- [Runtime Issues](#runtime-issues)
- [Frontend Issues](#frontend-issues)
- [Transport Issues](#transport-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Logging and Debugging](#logging-and-debugging)

## Installation Issues

### Cannot Connect to Database

**Symptoms:**
```
org.springframework.jdbc.CannotGetJdbcConnectionException: Failed to obtain JDBC Connection
```

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   # Linux
   sudo systemctl status postgresql

   # macOS
   brew services list

   # Check connection
   pg_isready
   ```

2. **Verify database exists:**
   ```bash
   psql -U postgres -c "\l" | grep thingsboard
   ```

3. **Check connection string:**
   ```yaml
   # thingsboard.yml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/thingsboard
       username: thingsboard
       password: your-password
   ```

4. **Test connection manually:**
   ```bash
   psql -h localhost -U thingsboard -d thingsboard
   ```

5. **Check PostgreSQL logs:**
   ```bash
   # Linux
   sudo tail -f /var/log/postgresql/postgresql-15-main.log

   # Docker
   docker logs tb-postgres
   ```

### Port Already in Use

**Symptoms:**
```
Web server failed to start. Port 8080 was already in use.
```

**Solutions:**

1. **Find process using port:**
   ```bash
   # Linux/macOS
   lsof -i :8080

   # Windows
   netstat -ano | findstr :8080
   ```

2. **Kill the process:**
   ```bash
   # Linux/macOS
   kill -9 <PID>

   # Windows
   taskkill /PID <PID> /F
   ```

3. **Change port:**
   ```yaml
   # thingsboard.yml
   server:
     port: 8081
   ```

### Java Version Mismatch

**Symptoms:**
```
Unsupported class file major version 61
```

**Solutions:**

1. **Check Java version:**
   ```bash
   java -version
   # Should show 17 or higher
   ```

2. **Install correct version:**
   ```bash
   # Ubuntu
   sudo apt-get install openjdk-17-jdk

   # macOS
   brew install openjdk@17
   ```

3. **Set JAVA_HOME:**
   ```bash
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
   export PATH=$JAVA_HOME/bin:$PATH
   ```

## Database Issues

### Schema Not Installed

**Symptoms:**
```
Table "device" doesn't exist
```

**Solutions:**

1. **Install schema:**
   ```bash
   java -cp application/target/thingsboard-*.jar \
     org.thingsboard.server.ThingsboardInstallApplication \
     --install
   ```

2. **Check if tables exist:**
   ```sql
   \dt
   SELECT * FROM tb_schema_settings;
   ```

### Database Migration Failed

**Symptoms:**
```
Migration failed at version X.Y.Z
```

**Solutions:**

1. **Check migration logs:**
   ```bash
   tail -f /var/log/thingsboard/thingsboard.log | grep -i migration
   ```

2. **Rollback and retry:**
   ```sql
   -- Check current version
   SELECT * FROM tb_schema_settings;

   -- Manual rollback if needed
   DELETE FROM tb_schema_settings WHERE key = 'schema.version';
   ```

3. **Backup before migration:**
   ```bash
   pg_dump -U thingsboard thingsboard > backup-before-migration.sql
   ```

### Connection Pool Exhausted

**Symptoms:**
```
Connection is not available, request timed out after 30000ms
```

**Solutions:**

1. **Increase pool size:**
   ```yaml
   spring:
     datasource:
       hikari:
         maximum-pool-size: 50  # Increase from default
         minimum-idle: 10
   ```

2. **Check for connection leaks:**
   ```bash
   # Monitor active connections
   SELECT count(*) FROM pg_stat_activity WHERE datname = 'thingsboard';
   ```

3. **Add connection timeout:**
   ```yaml
   spring:
     datasource:
       hikari:
         connection-timeout: 60000
         idle-timeout: 600000
   ```

### Slow Queries

**Symptoms:**
- Slow dashboard loading
- API timeouts

**Solutions:**

1. **Enable query logging:**
   ```sql
   -- postgresql.conf
   log_min_duration_statement = 1000  # Log queries > 1s
   ```

2. **Check slow queries:**
   ```sql
   SELECT * FROM pg_stat_statements
   ORDER BY total_exec_time DESC
   LIMIT 10;
   ```

3. **Add indexes:**
   ```sql
   -- Example: index on device search
   CREATE INDEX idx_device_name ON device(name);
   CREATE INDEX idx_device_tenant_id ON device(tenant_id);
   ```

4. **Vacuum database:**
   ```bash
   vacuumdb -U postgres -d thingsboard -z
   ```

## Build Issues

### Maven Build Fails

**Symptoms:**
```
[ERROR] Failed to execute goal
```

**Solutions:**

1. **Clear Maven cache:**
   ```bash
   rm -rf ~/.m2/repository
   mvn clean install -U
   ```

2. **Skip tests:**
   ```bash
   mvn clean install -DskipTests
   ```

3. **Check Java version:**
   ```bash
   mvn -version
   java -version
   ```

4. **Increase Maven memory:**
   ```bash
   export MAVEN_OPTS="-Xmx2G"
   mvn clean install
   ```

### Dependency Resolution Failed

**Symptoms:**
```
Could not resolve dependencies for project
```

**Solutions:**

1. **Update dependencies:**
   ```bash
   mvn clean install -U
   ```

2. **Check Maven settings:**
   ```xml
   <!-- ~/.m2/settings.xml -->
   <settings>
     <mirrors>
       <mirror>
         <id>central</id>
         <url>https://repo.maven.apache.org/maven2</url>
         <mirrorOf>central</mirrorOf>
       </mirror>
     </mirrors>
   </settings>
   ```

3. **Use dependency tree:**
   ```bash
   mvn dependency:tree
   ```

### Frontend Build Fails

**Symptoms:**
```
npm ERR! code ELIFECYCLE
```

**Solutions:**

1. **Clear npm cache:**
   ```bash
   cd frontend-react
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

2. **Check Node.js version:**
   ```bash
   node -v  # Should be 18+
   npm -v
   ```

3. **Increase memory:**
   ```bash
   export NODE_OPTIONS=--max_old_space_size=4096
   npm run build
   ```

4. **Check for TypeScript errors:**
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

## Runtime Issues

### Application Crashes on Startup

**Symptoms:**
- Application starts then crashes
- Exits with code 1

**Solutions:**

1. **Check logs:**
   ```bash
   tail -f /var/log/thingsboard/thingsboard.log
   ```

2. **Increase heap size:**
   ```bash
   export JAVA_OPTS="-Xms2G -Xmx4G"
   java -jar application/target/thingsboard-*.jar
   ```

3. **Check configuration:**
   ```bash
   # Validate YAML syntax
   python -c "import yaml; yaml.safe_load(open('thingsboard.yml'))"
   ```

4. **Check dependencies:**
   ```bash
   # Ensure PostgreSQL/Redis are running
   pg_isready
   redis-cli ping
   ```

### Out of Memory Error

**Symptoms:**
```
java.lang.OutOfMemoryError: Java heap space
```

**Solutions:**

1. **Increase heap size:**
   ```bash
   export JAVA_OPTS="-Xms4G -Xmx8G"
   ```

2. **Enable GC logging:**
   ```bash
   export JAVA_OPTS="-Xlog:gc*:file=gc.log -Xms2G -Xmx4G"
   ```

3. **Analyze heap dump:**
   ```bash
   # Enable heap dump on OOM
   export JAVA_OPTS="-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp"

   # Analyze dump
   jhat /tmp/java_pid12345.hprof
   ```

4. **Check for memory leaks:**
   - Use VisualVM or JProfiler
   - Monitor with JMX

### High CPU Usage

**Symptoms:**
- CPU usage constantly at 100%
- Slow response times

**Solutions:**

1. **Check thread dump:**
   ```bash
   # Get PID
   jps

   # Take thread dump
   jstack <PID> > thread-dump.txt
   ```

2. **Profile application:**
   ```bash
   # Use async-profiler
   ./profiler.sh -d 60 -f cpu-profile.html <PID>
   ```

3. **Check for infinite loops:**
   - Review rule chain configurations
   - Check custom rule nodes

4. **Optimize rule chains:**
   - Reduce unnecessary nodes
   - Add filters early
   - Batch operations

### Login Fails

**Symptoms:**
- Cannot login with default credentials
- Authentication errors

**Solutions:**

1. **Check default credentials:**
   - Username: `sysadmin@thingsboard.org`
   - Password: `sysadmin`

2. **Reset admin password:**
   ```sql
   -- Find admin user
   SELECT id, email FROM tb_user WHERE email = 'sysadmin@thingsboard.org';

   -- Reset password (password: 'sysadmin')
   UPDATE tb_user
   SET password = '$2a$10$5JTB8NK6kbGjmIgSnDtgkO7Hroxi/cOfY68Y9HCYJO/cjWFg3ZQJG'
   WHERE email = 'sysadmin@thingsboard.org';
   ```

3. **Check JWT configuration:**
   ```yaml
   security:
     jwt:
       tokenExpirationTime: 9000  # seconds
       refreshTokenExpTime: 604800
   ```

4. **Clear browser cache and cookies**

## Frontend Issues

### Blank Page After Login

**Symptoms:**
- Login succeeds but page is blank
- No errors in UI

**Solutions:**

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

2. **Verify API connection:**
   ```javascript
   // In browser console
   fetch('/api/auth/user')
     .then(r => r.json())
     .then(console.log)
   ```

3. **Check proxy configuration:**
   ```typescript
   // vite.config.ts
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:8080',
         changeOrigin: true,
       },
     },
   }
   ```

4. **Clear browser storage:**
   - Clear localStorage
   - Clear sessionStorage
   - Clear cookies

### WebSocket Connection Failed

**Symptoms:**
```
WebSocket connection failed
Real-time updates not working
```

**Solutions:**

1. **Check WebSocket endpoint:**
   ```javascript
   // Should connect to ws://localhost:8080/api/ws
   ```

2. **Verify proxy WebSocket upgrade:**
   ```nginx
   # nginx.conf
   location /api/ws {
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   ```

3. **Check firewall:**
   ```bash
   # Allow WebSocket connections
   sudo ufw allow 8080/tcp
   ```

4. **Enable WebSocket in Spring:**
   ```yaml
   server:
     websocket:
       enabled: true
   ```

### Dashboard Not Loading

**Symptoms:**
- Dashboard widgets show loading forever
- Data not appearing

**Solutions:**

1. **Check API calls:**
   - Open DevTools Network tab
   - Look for failed /api/plugins/telemetry requests

2. **Verify device data:**
   ```sql
   SELECT * FROM ts_kv
   WHERE entity_id = '<device-id>'
   ORDER BY ts DESC
   LIMIT 10;
   ```

3. **Check rule chain:**
   - Ensure "Save Timeseries" node is present
   - Verify rule chain is active

4. **Clear cache:**
   ```bash
   # Clear Redis cache
   redis-cli FLUSHALL
   ```

## Transport Issues

### MQTT Connection Failed

**Symptoms:**
- Devices cannot connect via MQTT
- Connection refused errors

**Solutions:**

1. **Check MQTT is enabled:**
   ```yaml
   transport:
     mqtt:
       enabled: true
       bind_port: 1883
   ```

2. **Test MQTT connection:**
   ```bash
   # Using mosquitto_pub
   mosquitto_pub -h localhost -p 1883 \
     -t v1/devices/me/telemetry \
     -u '<access-token>' \
     -m '{"temperature":25}'
   ```

3. **Check firewall:**
   ```bash
   sudo ufw allow 1883/tcp
   sudo ufw allow 8883/tcp  # For MQTT over TLS
   ```

4. **Verify device credentials:**
   ```sql
   SELECT * FROM device_credentials
   WHERE credentials_id = '<access-token>';
   ```

### HTTP Transport Timeout

**Symptoms:**
```
Connection timeout when sending telemetry
```

**Solutions:**

1. **Increase timeout:**
   ```yaml
   transport:
     http:
       timeout: 30000  # milliseconds
   ```

2. **Check server load:**
   ```bash
   top
   htop
   ```

3. **Test HTTP endpoint:**
   ```bash
   curl -v -X POST http://localhost:8080/api/v1/<access-token>/telemetry \
     -H "Content-Type: application/json" \
     -d '{"temperature":25}'
   ```

### CoAP Not Working

**Symptoms:**
- CoAP clients cannot connect
- No response from server

**Solutions:**

1. **Check CoAP is enabled:**
   ```yaml
   transport:
     coap:
       enabled: true
       bind_port: 5683
   ```

2. **Test with CoAP client:**
   ```bash
   # Using coap-client
   coap-client -m post -t text/plain \
     -e '{"temperature":25}' \
     coap://localhost:5683/api/v1/<access-token>/telemetry
   ```

3. **Check UDP port:**
   ```bash
   sudo ufw allow 5683/udp
   ```

## Performance Issues

### Slow Dashboard Loading

**Solutions:**

1. **Optimize time range:**
   - Reduce dashboard time window
   - Use aggregation for large datasets

2. **Add database indexes:**
   ```sql
   CREATE INDEX idx_ts_kv_entity_key_ts
   ON ts_kv(entity_id, key, ts DESC);
   ```

3. **Enable caching:**
   ```yaml
   cache:
     type: redis
   ```

4. **Use Cassandra for time-series:**
   - Better for high-volume telemetry
   - Horizontal scalability

### Rule Engine Slow

**Solutions:**

1. **Optimize rule chains:**
   - Add filters early in chain
   - Remove unnecessary nodes
   - Use batching

2. **Increase thread pool:**
   ```yaml
   actors:
     system:
       throughput: 10
     rule:
       thread_pool_size: 8
   ```

3. **Use async processing:**
   - Enable message queue
   - Use Kafka for high volume

4. **Monitor queue size:**
   ```bash
   # Check JMX metrics
   jconsole
   ```

## Security Issues

### Unauthorized Access

**Solutions:**

1. **Check Spring Security config**
2. **Verify JWT tokens**
3. **Review audit logs:**
   ```sql
   SELECT * FROM audit_log
   ORDER BY created_time DESC
   LIMIT 100;
   ```

### CORS Errors

**Symptoms:**
```
Access-Control-Allow-Origin header is missing
```

**Solutions:**

1. **Configure CORS:**
   ```java
   @Configuration
   public class WebConfig implements WebMvcConfigurer {
       @Override
       public void addCorsMappings(CorsRegistry registry) {
           registry.addMapping("/api/**")
               .allowedOrigins("http://localhost:5173")
               .allowedMethods("*");
       }
   }
   ```

## Logging and Debugging

### Enable Debug Logging

**logback.xml:**

```xml
<configuration>
    <!-- Application logs -->
    <logger name="org.thingsboard" level="DEBUG"/>

    <!-- Database queries -->
    <logger name="org.thingsboard.server.dao" level="TRACE"/>

    <!-- Rule engine -->
    <logger name="org.thingsboard.server.actors" level="DEBUG"/>

    <!-- HTTP transport -->
    <logger name="org.thingsboard.server.transport.http" level="DEBUG"/>

    <!-- SQL queries -->
    <logger name="org.hibernate.SQL" level="DEBUG"/>
    <logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="TRACE"/>
</configuration>
```

### Useful Log Locations

```bash
# Application logs
/var/log/thingsboard/thingsboard.log

# System logs (systemd)
journalctl -u thingsboard -f

# Docker logs
docker logs -f thingsboard
```

### Debug with Remote JVM

```bash
# Start with debug port
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 \
  -jar thingsboard.jar

# Connect from IDE to localhost:5005
```

## Getting Help

If you can't find a solution here:

1. **Check logs** - Most issues leave traces in logs
2. **Search GitHub Issues**: https://github.com/thingsboard/thingsboard/issues
3. **Stack Overflow**: Tag questions with `thingsboard`
4. **Documentation**: https://thingsboard.io/docs/
5. **Community Forum**: https://groups.google.com/forum/#!forum/thingsboard

## Reporting Bugs

When reporting issues, include:

- ThingsBoard version
- OS and version
- Java version
- Database (PostgreSQL/Cassandra) version
- Error logs (full stack trace)
- Steps to reproduce
- Expected vs actual behavior

---

Last updated: 2025-11-17
