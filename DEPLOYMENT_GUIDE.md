# Deployment Guide

This guide covers deploying ThingsBoard to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Manual Deployment](#manual-deployment)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Load Balancing](#load-balancing)
- [Monitoring](#monitoring)
- [Backup and Recovery](#backup-and-recovery)
- [Security Hardening](#security-hardening)
- [Performance Tuning](#performance-tuning)

## Prerequisites

### System Requirements

**Minimum** (small deployment):
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk**: 50 GB SSD
- **Network**: 100 Mbps

**Recommended** (production):
- **CPU**: 8+ cores
- **RAM**: 16+ GB
- **Disk**: 200+ GB SSD
- **Network**: 1 Gbps

**Large Scale** (microservices mode):
- **CPU**: 16+ cores per service
- **RAM**: 32+ GB per service
- **Disk**: 500+ GB SSD
- **Network**: 10 Gbps

### Software Requirements

| Component | Version | Purpose |
|-----------|---------|---------|
| Java JDK | 17+ | Runtime |
| PostgreSQL | 13+ | Database |
| Redis | 6+ | Cache (optional) |
| Nginx | 1.20+ | Reverse proxy |
| Docker | 20.10+ | Containerization |
| Kubernetes | 1.24+ | Orchestration |

## Deployment Options

### 1. Docker Compose (Recommended for Small/Medium)

**Pros**:
- Simple setup
- Easy to maintain
- Good for single server

**Cons**:
- Limited scalability
- Single point of failure

### 2. Kubernetes (Recommended for Production)

**Pros**:
- Highly scalable
- High availability
- Auto-recovery
- Rolling updates

**Cons**:
- Complex setup
- Requires k8s knowledge

### 3. Manual Installation

**Pros**:
- Full control
- Custom configuration

**Cons**:
- Time-consuming
- Manual updates

## Docker Deployment

### Using Docker Compose

**1. Create docker-compose.yml:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: tb-postgres
    restart: always
    environment:
      POSTGRES_DB: thingsboard
      POSTGRES_USER: thingsboard
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - thingsboard-network

  redis:
    image: redis:7-alpine
    container_name: tb-redis
    restart: always
    networks:
      - thingsboard-network

  thingsboard:
    image: thingsboard/tb-postgres:latest
    container_name: thingsboard
    restart: always
    ports:
      - "8080:9090"
      - "1883:1883"
      - "5683:5683/udp"
    environment:
      TB_QUEUE_TYPE: in-memory
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/thingsboard
      SPRING_DATASOURCE_USERNAME: thingsboard
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    volumes:
      - tb-data:/data
      - tb-logs:/var/log/thingsboard
    networks:
      - thingsboard-network

volumes:
  postgres-data:
  tb-data:
  tb-logs:

networks:
  thingsboard-network:
    driver: bridge
```

**2. Create .env file:**

```bash
DB_PASSWORD=your-secure-password
```

**3. Deploy:**

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f thingsboard

# Install schema
docker-compose exec thingsboard sh -c \
  "java -cp /usr/share/thingsboard/bin/thingsboard.jar \
   org.thingsboard.server.ThingsboardInstallApplication \
   --install"

# Restart to apply
docker-compose restart thingsboard
```

**4. Access:**
- Web UI: http://localhost:8080
- MQTT: localhost:1883
- CoAP: localhost:5683

### Building Custom Docker Image

```bash
# Build backend
mvn clean install -DskipTests

# Build frontend
cd frontend-react
npm run build

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy application
COPY application/target/thingsboard-*.jar /app/thingsboard.jar
COPY frontend-react/dist /app/public

# Expose ports
EXPOSE 8080 1883 5683/udp

# Run application
ENTRYPOINT ["java", "-jar", "/app/thingsboard.jar"]
EOF

# Build image
docker build -t thingsboard:custom .

# Run container
docker run -d \
  -p 8080:8080 \
  -p 1883:1883 \
  -p 5683:5683/udp \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/thingsboard \
  thingsboard:custom
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- kubectl configured
- Helm 3 installed

### Using Helm

**1. Add ThingsBoard Helm repository:**

```bash
helm repo add thingsboard https://thingsboard.io/helm
helm repo update
```

**2. Create values.yaml:**

```yaml
# values.yaml
replicaCount: 2

image:
  repository: thingsboard/tb-postgres
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  httpPort: 9090
  mqttPort: 1883
  coapPort: 5683

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: thingsboard.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: thingsboard-tls
      hosts:
        - thingsboard.example.com

postgresql:
  enabled: true
  auth:
    username: thingsboard
    password: thingsboard
    database: thingsboard
  primary:
    persistence:
      enabled: true
      size: 50Gi

redis:
  enabled: true
  auth:
    enabled: false

resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi

persistence:
  enabled: true
  size: 20Gi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

**3. Deploy:**

```bash
# Create namespace
kubectl create namespace thingsboard

# Deploy with Helm
helm install thingsboard thingsboard/thingsboard \
  -f values.yaml \
  -n thingsboard

# Check status
kubectl get pods -n thingsboard
kubectl get svc -n thingsboard
```

### Manual Kubernetes Deployment

**1. Create namespace:**

```bash
kubectl create namespace thingsboard
```

**2. Create secrets:**

```bash
kubectl create secret generic db-credentials \
  --from-literal=username=thingsboard \
  --from-literal=password=your-secure-password \
  -n thingsboard
```

**3. Deploy PostgreSQL:**

```yaml
# postgres-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: thingsboard
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: thingsboard
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 50Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: thingsboard
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
```

**4. Deploy ThingsBoard:**

```yaml
# thingsboard-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thingsboard
  namespace: thingsboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: thingsboard
  template:
    metadata:
      labels:
        app: thingsboard
    spec:
      containers:
      - name: thingsboard
        image: thingsboard/tb-postgres:latest
        ports:
        - containerPort: 9090
          name: http
        - containerPort: 1883
          name: mqtt
        - containerPort: 5683
          name: coap
          protocol: UDP
        env:
        - name: SPRING_DATASOURCE_URL
          value: jdbc:postgresql://postgres:5432/thingsboard
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /login
            port: 9090
          initialDelaySeconds: 120
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /login
            port: 9090
          initialDelaySeconds: 60
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: thingsboard
  namespace: thingsboard
spec:
  type: LoadBalancer
  selector:
    app: thingsboard
  ports:
  - name: http
    port: 80
    targetPort: 9090
  - name: mqtt
    port: 1883
    targetPort: 1883
  - name: coap
    port: 5683
    targetPort: 5683
    protocol: UDP
```

**5. Apply configurations:**

```bash
kubectl apply -f postgres-deployment.yaml
kubectl apply -f thingsboard-deployment.yaml
```

## Manual Deployment

### Ubuntu/Debian Installation

**1. Install Java:**

```bash
sudo apt-get update
sudo apt-get install openjdk-17-jdk
```

**2. Install PostgreSQL:**

```bash
sudo apt-get install postgresql-15
sudo -u postgres psql -c "CREATE DATABASE thingsboard;"
sudo -u postgres psql -c "CREATE USER thingsboard WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE thingsboard TO thingsboard;"
```

**3. Build ThingsBoard:**

```bash
git clone https://github.com/thingsboard/thingsboard.git
cd thingsboard
mvn clean install -DskipTests
```

**4. Install schema:**

```bash
java -cp application/target/thingsboard-*.jar \
  org.thingsboard.server.ThingsboardInstallApplication \
  --install
```

**5. Create systemd service:**

```bash
sudo cat > /etc/systemd/system/thingsboard.service << 'EOF'
[Unit]
Description=ThingsBoard Server
After=network.target postgresql.service

[Service]
Type=simple
User=thingsboard
WorkingDirectory=/opt/thingsboard
ExecStart=/usr/bin/java -jar /opt/thingsboard/thingsboard.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create user
sudo useradd -r -s /bin/false thingsboard

# Copy application
sudo mkdir /opt/thingsboard
sudo cp application/target/thingsboard-*.jar /opt/thingsboard/thingsboard.jar
sudo chown -R thingsboard:thingsboard /opt/thingsboard

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable thingsboard
sudo systemctl start thingsboard
```

## Database Setup

### PostgreSQL Configuration

**postgresql.conf tuning:**

```ini
# Memory
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB

# WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# Query Planning
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# Connections
max_connections = 200
```

**Create time-series partitions:**

```sql
-- Partition telemetry table by month
CREATE TABLE ts_kv_partitioned (
    entity_id UUID NOT NULL,
    key INTEGER NOT NULL,
    ts BIGINT NOT NULL,
    bool_v BOOLEAN,
    str_v VARCHAR(10000000),
    long_v BIGINT,
    dbl_v DOUBLE PRECISION,
    json_v JSON,
    PRIMARY KEY (entity_id, key, ts)
) PARTITION BY RANGE (ts);

-- Create partitions for each month
CREATE TABLE ts_kv_2025_01 PARTITION OF ts_kv_partitioned
    FOR VALUES FROM (1704067200000) TO (1706745600000);
-- Add more partitions...
```

### Redis Configuration

**redis.conf:**

```ini
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

## Configuration

### Application Configuration

**application/src/main/resources/thingsboard.yml:**

```yaml
server:
  port: 8080
  address: 0.0.0.0

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/thingsboard
    username: thingsboard
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: none
    properties:
      hibernate:
        jdbc:
          batch_size: 50

redis:
  connection:
    type: standalone
  standalone:
    host: localhost
    port: 6379

cache:
  type: redis
  maximumPoolSize: 16

transport:
  http:
    enabled: true
  mqtt:
    enabled: true
    bind_address: 0.0.0.0
    bind_port: 1883
    timeout: 10000
  coap:
    enabled: true
    bind_address: 0.0.0.0
    bind_port: 5683

actors:
  system:
    throughput: 5
  tenant:
    create_components_on_init: true
```

### Environment Variables

```bash
# Database
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/thingsboard
export SPRING_DATASOURCE_USERNAME=thingsboard
export SPRING_DATASOURCE_PASSWORD=your-password

# Server
export HTTP_BIND_PORT=8080

# Redis
export REDIS_HOST=localhost
export REDIS_PORT=6379

# JVM
export JAVA_OPTS="-Xms2G -Xmx4G"
```

## SSL/TLS Setup

### Using Nginx as Reverse Proxy

**nginx.conf:**

```nginx
upstream thingsboard {
    server localhost:8080;
}

server {
    listen 80;
    server_name thingsboard.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name thingsboard.example.com;

    ssl_certificate /etc/letsencrypt/live/thingsboard.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thingsboard.example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;

    location / {
        proxy_pass http://thingsboard;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ws {
        proxy_pass http://thingsboard;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# MQTT over TLS
stream {
    upstream mqtt {
        server localhost:1883;
    }

    server {
        listen 8883 ssl;
        proxy_pass mqtt;

        ssl_certificate /etc/letsencrypt/live/thingsboard.example.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/thingsboard.example.com/privkey.pem;
    }
}
```

### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d thingsboard.example.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Load Balancing

### Nginx Load Balancer

```nginx
upstream thingsboard-cluster {
    least_conn;
    server tb1.example.com:8080 weight=1 max_fails=3 fail_timeout=30s;
    server tb2.example.com:8080 weight=1 max_fails=3 fail_timeout=30s;
    server tb3.example.com:8080 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;

    location / {
        proxy_pass http://thingsboard-cluster;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring

### Prometheus Integration

**prometheus.yml:**

```yaml
scrape_configs:
  - job_name: 'thingsboard'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8080']
```

### Grafana Dashboards

Import ThingsBoard dashboards:
- System metrics
- JVM metrics
- Database metrics
- Rule engine metrics

## Backup and Recovery

### Database Backup

```bash
# Backup
pg_dump -U thingsboard thingsboard > thingsboard-backup-$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U thingsboard thingsboard | gzip > thingsboard-backup-$(date +%Y%m%d).sql.gz

# Restore
psql -U thingsboard thingsboard < thingsboard-backup-20251117.sql
```

### Automated Backups

```bash
#!/bin/bash
# /usr/local/bin/backup-thingsboard.sh

BACKUP_DIR=/var/backups/thingsboard
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=7

# Create backup
pg_dump -U thingsboard thingsboard | gzip > "$BACKUP_DIR/thingsboard-$DATE.sql.gz"

# Remove old backups
find $BACKUP_DIR -name "thingsboard-*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Add to crontab
# 0 2 * * * /usr/local/bin/backup-thingsboard.sh
```

## Security Hardening

See [SECURITY.md](./security.md) for detailed security guidelines.

**Quick checklist:**
- [ ] Change default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Audit logging enabled
- [ ] Strong JWT secret
- [ ] Database encryption

## Performance Tuning

### JVM Tuning

```bash
export JAVA_OPTS="-server \
  -Xms4G -Xmx8G \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+UseStringDeduplication \
  -XX:+ParallelRefProcEnabled"
```

### Connection Pool

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

## Additional Resources

- **Official Docs**: https://thingsboard.io/docs/user-guide/install/
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Development**: [DEVELOPMENT.md](./DEVELOPMENT.md)

---

Last updated: 2025-11-17
