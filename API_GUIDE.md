# API Guide

Complete guide to using ThingsBoard REST API and device communication APIs.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [REST API](#rest-api)
- [Device APIs](#device-apis)
- [WebSocket API](#websocket-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

ThingsBoard provides multiple APIs:

1. **REST API** - Administrative operations (devices, users, dashboards)
2. **Device APIs** - Device telemetry and communication (HTTP, MQTT, CoAP)
3. **WebSocket API** - Real-time data subscriptions
4. **RPC API** - Remote procedure calls to devices

### Base URLs

- **REST API**: `http://localhost:8080/api`
- **Device HTTP API**: `http://localhost:8080/api/v1`
- **MQTT**: `mqtt://localhost:1883`
- **CoAP**: `coap://localhost:5683`
- **WebSocket**: `ws://localhost:8080/api/ws`

### API Documentation

Interactive API documentation available at:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

## Authentication

### User Authentication (REST API)

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "tenant@thingsboard.org",
  "password": "tenant"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

#### Using JWT Token

Include token in Authorization header for all subsequent requests:

```http
GET /api/device
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

#### Refresh Token

```http
POST /api/auth/token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

### Device Authentication

Devices authenticate using **access tokens** assigned per device.

#### Get Device Access Token

```http
GET /api/device/{deviceId}/credentials
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "credentialsType": "ACCESS_TOKEN",
  "credentialsId": "A1_TEST_TOKEN"
}
```

## REST API

### Devices

#### Create Device

```http
POST /api/device
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Temperature Sensor",
  "type": "thermometer",
  "label": "Living Room"
}
```

**Response:**
```json
{
  "id": {
    "id": "e1e0a510-5e5e-11ec-bf63-0242ac130002",
    "entityType": "DEVICE"
  },
  "createdTime": 1640000000000,
  "tenantId": {...},
  "customerId": {...},
  "name": "Temperature Sensor",
  "type": "thermometer",
  "label": "Living Room"
}
```

#### Get Device

```http
GET /api/device/{deviceId}
Authorization: Bearer <jwt-token>
```

#### Get Devices by Type

```http
GET /api/tenant/devices?type=thermometer&pageSize=10&page=0
Authorization: Bearer <jwt-token>
```

#### Update Device

```http
POST /api/device
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "id": {
    "id": "e1e0a510-5e5e-11ec-bf63-0242ac130002",
    "entityType": "DEVICE"
  },
  "name": "Updated Temperature Sensor",
  "type": "thermometer"
}
```

#### Delete Device

```http
DELETE /api/device/{deviceId}
Authorization: Bearer <jwt-token>
```

### Telemetry

#### Get Latest Telemetry

```http
GET /api/plugins/telemetry/DEVICE/{deviceId}/values/timeseries?keys=temperature,humidity
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "temperature": [
    {
      "ts": 1640000000000,
      "value": "25.5"
    }
  ],
  "humidity": [
    {
      "ts": 1640000000000,
      "value": "60"
    }
  ]
}
```

#### Get Telemetry Time Series

```http
GET /api/plugins/telemetry/DEVICE/{deviceId}/values/timeseries?keys=temperature&startTs=1640000000000&endTs=1640100000000&limit=100
Authorization: Bearer <jwt-token>
```

#### Delete Telemetry

```http
DELETE /api/plugins/telemetry/DEVICE/{deviceId}/timeseries/delete?keys=temperature&deleteAllDataForKeys=false&startTs=1640000000000&endTs=1640100000000
Authorization: Bearer <jwt-token>
```

### Attributes

#### Get Attributes

```http
GET /api/plugins/telemetry/DEVICE/{deviceId}/values/attributes?keys=model,firmwareVersion
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "key": "model",
    "value": "DHT22"
  },
  {
    "key": "firmwareVersion",
    "value": "1.2.3"
  }
]
```

#### Save Device Attributes

```http
POST /api/plugins/telemetry/DEVICE/{deviceId}/attributes/SERVER_SCOPE
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "location": "Building A",
  "floor": 2
}
```

#### Delete Attributes

```http
DELETE /api/plugins/telemetry/DEVICE/{deviceId}/SERVER_SCOPE?keys=location,floor
Authorization: Bearer <jwt-token>
```

### Users

#### Create User

```http
POST /api/user
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "authority": "CUSTOMER_USER",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Get Users

```http
GET /api/users?pageSize=10&page=0
Authorization: Bearer <jwt-token>
```

### Customers

#### Create Customer

```http
POST /api/customer
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Customer A",
  "email": "customer@example.com",
  "phone": "+1234567890"
}
```

#### Assign Device to Customer

```http
POST /api/customer/{customerId}/device/{deviceId}
Authorization: Bearer <jwt-token>
```

### Dashboards

#### Create Dashboard

```http
POST /api/dashboard
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Temperature Dashboard",
  "configuration": {
    "widgets": [...],
    "states": {...}
  }
}
```

#### Get Dashboard

```http
GET /api/dashboard/{dashboardId}
Authorization: Bearer <jwt-token>
```

#### Get Tenant Dashboards

```http
GET /api/tenant/dashboards?pageSize=10&page=0
Authorization: Bearer <jwt-token>
```

### Rule Chains

#### Get Rule Chains

```http
GET /api/ruleChains?pageSize=10&page=0
Authorization: Bearer <jwt-token>
```

#### Get Rule Chain

```http
GET /api/ruleChain/{ruleChainId}
Authorization: Bearer <jwt-token>
```

#### Get Rule Chain Metadata

```http
GET /api/ruleChain/{ruleChainId}/metadata
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "ruleChainId": {...},
  "firstNodeIndex": 0,
  "nodes": [
    {
      "id": {...},
      "type": "FILTER",
      "name": "Filter by temperature",
      "configuration": {...}
    }
  ],
  "connections": [
    {
      "fromIndex": 0,
      "toIndex": 1,
      "type": "True"
    }
  ]
}
```

## Device APIs

### HTTP Device API

#### Send Telemetry

```http
POST /api/v1/{accessToken}/telemetry
Content-Type: application/json

{
  "temperature": 25.5,
  "humidity": 60,
  "pressure": 1013
}
```

**Multiple data points:**
```http
POST /api/v1/{accessToken}/telemetry
Content-Type: application/json

[
  {
    "ts": 1640000000000,
    "values": {
      "temperature": 25.5,
      "humidity": 60
    }
  },
  {
    "ts": 1640001000000,
    "values": {
      "temperature": 26.0,
      "humidity": 61
    }
  }
]
```

#### Send Attributes

```http
POST /api/v1/{accessToken}/attributes
Content-Type: application/json

{
  "model": "DHT22",
  "firmwareVersion": "1.2.3"
}
```

#### Request Attributes

```http
GET /api/v1/{accessToken}/attributes?clientKeys=latitude,longitude&sharedKeys=targetTemperature
```

**Response:**
```json
{
  "client": {
    "latitude": "42.3601",
    "longitude": "-71.0589"
  },
  "shared": {
    "targetTemperature": "22"
  }
}
```

#### RPC Request from Device

```http
POST /api/v1/{accessToken}/rpc
Content-Type: application/json

{
  "method": "getServerTime",
  "params": {}
}
```

### MQTT Device API

#### Connect

```bash
# Using mosquitto_pub/sub
mosquitto_pub -d -h localhost -p 1883 \
  -t v1/devices/me/telemetry \
  -u '<access-token>' \
  -m '{"temperature":25}'
```

#### Topics

**Publish Telemetry:**
```
Topic: v1/devices/me/telemetry
Payload: {"temperature":25,"humidity":60}
```

**Publish Attributes:**
```
Topic: v1/devices/me/attributes
Payload: {"model":"DHT22","firmwareVersion":"1.2.3"}
```

**Request Attributes:**
```
Topic: v1/devices/me/attributes/request/1
Payload: {"clientKeys":"latitude,longitude"}

Response Topic: v1/devices/me/attributes/response/1
Response: {"client":{"latitude":"42.3601"}}
```

**Subscribe to Attribute Updates:**
```
Subscribe Topic: v1/devices/me/attributes
Message: {"targetTemperature":"22"}
```

**RPC from Server:**
```
Subscribe Topic: v1/devices/me/rpc/request/+
Message: {"method":"setGpio","params":{"pin":1,"value":true}}

Response Topic: v1/devices/me/rpc/response/1
Response: {"success":true}
```

**RPC to Server:**
```
Publish Topic: v1/devices/me/rpc/request/1
Payload: {"method":"getCurrentTime","params":{}}

Response Topic: v1/devices/me/rpc/response/1
Response: {"time":1640000000000}
```

#### MQTT Client Examples

**Python (paho-mqtt):**

```python
import paho.mqtt.client as mqtt
import json
import time

ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN'
BROKER = 'localhost'
PORT = 1883

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    # Subscribe to RPC requests
    client.subscribe('v1/devices/me/rpc/request/+')

def on_message(client, userdata, msg):
    print(f"Received: {msg.topic} {msg.payload}")

client = mqtt.Client()
client.username_pw_set(ACCESS_TOKEN)
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.loop_start()

# Send telemetry
while True:
    telemetry = {
        "temperature": 25.5,
        "humidity": 60
    }
    client.publish('v1/devices/me/telemetry', json.dumps(telemetry))
    time.sleep(10)
```

**JavaScript (mqtt.js):**

```javascript
const mqtt = require('mqtt');

const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN';
const client = mqtt.connect('mqtt://localhost:1883', {
  username: ACCESS_TOKEN
});

client.on('connect', () => {
  console.log('Connected');

  // Subscribe to attribute updates
  client.subscribe('v1/devices/me/attributes');

  // Send telemetry
  const telemetry = {
    temperature: 25.5,
    humidity: 60
  };
  client.publish('v1/devices/me/telemetry', JSON.stringify(telemetry));
});

client.on('message', (topic, message) => {
  console.log('Received:', topic, message.toString());
});
```

### CoAP Device API

#### Send Telemetry

```bash
coap-client -m post -t text/plain \
  -e '{"temperature":25}' \
  coap://localhost:5683/api/v1/<access-token>/telemetry
```

#### Send Attributes

```bash
coap-client -m post -t text/plain \
  -e '{"model":"DHT22"}' \
  coap://localhost:5683/api/v1/<access-token>/attributes
```

## WebSocket API

### Subscribe to Telemetry

```javascript
const ws = new WebSocket('ws://localhost:8080/api/ws');

// Authenticate
ws.onopen = () => {
  ws.send(JSON.stringify({
    authCmd: {
      cmdId: 0,
      token: '<jwt-token>'
    }
  }));
};

// Subscribe to device telemetry
ws.send(JSON.stringify({
  tsSubCmds: [{
    entityType: 'DEVICE',
    entityId: '<device-id>',
    scope: 'LATEST_TELEMETRY',
    cmdId: 1
  }]
}));

// Handle messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Telemetry update:', data);
};
```

### Subscribe to Attributes

```javascript
ws.send(JSON.stringify({
  attrSubCmds: [{
    entityType: 'DEVICE',
    entityId: '<device-id>',
    scope: 'CLIENT_SCOPE',
    cmdId: 2
  }]
}));
```

### Unsubscribe

```javascript
ws.send(JSON.stringify({
  tsSubCmds: [{
    unsubscribe: true,
    cmdId: 1
  }]
}));
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid credentials |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "status": 400,
  "message": "Invalid device name",
  "errorCode": 2,
  "timestamp": "2025-11-17T10:00:00.000+00:00"
}
```

### Common Errors

**Invalid Token:**
```json
{
  "status": 401,
  "message": "Token has expired",
  "errorCode": 11
}
```

**Resource Not Found:**
```json
{
  "status": 404,
  "message": "Requested item wasn't found!",
  "errorCode": 31
}
```

**Validation Error:**
```json
{
  "status": 400,
  "message": "Device name should be specified!",
  "errorCode": 2
}
```

## Rate Limiting

### Default Limits

- **REST API**: 1000 requests/minute per user
- **Device API**: 100 requests/minute per device
- **WebSocket**: 100 messages/minute per connection

### Rate Limit Headers

```http
X-Rate-Limit-Limit: 1000
X-Rate-Limit-Remaining: 999
X-Rate-Limit-Reset: 1640000060
```

### Rate Limit Response

```json
{
  "status": 429,
  "message": "Too many requests",
  "errorCode": 8
}
```

## Examples

### Complete Device Registration Flow

```python
import requests
import json

BASE_URL = 'http://localhost:8080'

# 1. Login
login_response = requests.post(
    f'{BASE_URL}/api/auth/login',
    json={
        'username': 'tenant@thingsboard.org',
        'password': 'tenant'
    }
)
token = login_response.json()['token']

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# 2. Create Device
device_response = requests.post(
    f'{BASE_URL}/api/device',
    headers=headers,
    json={
        'name': 'Temperature Sensor 1',
        'type': 'thermometer'
    }
)
device = device_response.json()
device_id = device['id']['id']

# 3. Get Device Credentials
credentials_response = requests.get(
    f'{BASE_URL}/api/device/{device_id}/credentials',
    headers=headers
)
access_token = credentials_response.json()['credentialsId']

# 4. Send Telemetry from Device
telemetry_response = requests.post(
    f'{BASE_URL}/api/v1/{access_token}/telemetry',
    json={
        'temperature': 25.5,
        'humidity': 60
    }
)

print(f'Device ID: {device_id}')
print(f'Access Token: {access_token}')
print(f'Telemetry sent: {telemetry_response.status_code}')
```

### Real-time Dashboard Update

```javascript
// Subscribe to device updates via WebSocket
const subscribeToDevice = (deviceId, callback) => {
  const ws = new WebSocket('ws://localhost:8080/api/ws');

  ws.onopen = () => {
    // Authenticate
    ws.send(JSON.stringify({
      authCmd: {
        cmdId: 0,
        token: localStorage.getItem('jwt_token')
      }
    }));

    // Subscribe to latest telemetry
    ws.send(JSON.stringify({
      tsSubCmds: [{
        entityType: 'DEVICE',
        entityId: deviceId,
        scope: 'LATEST_TELEMETRY',
        cmdId: 1
      }]
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.data) {
      callback(data.data);
    }
  };

  return ws;
};

// Usage
const ws = subscribeToDevice('device-uuid-here', (telemetry) => {
  console.log('Temperature:', telemetry.temperature[0][1]);
  console.log('Humidity:', telemetry.humidity[0][1]);
});
```

### Bulk Data Upload

```python
import requests
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:8080'
ACCESS_TOKEN = 'YOUR_DEVICE_ACCESS_TOKEN'

# Generate historical data
data_points = []
start_time = datetime.now() - timedelta(days=7)

for i in range(100):
    timestamp = int((start_time + timedelta(hours=i)).timestamp() * 1000)
    data_points.append({
        'ts': timestamp,
        'values': {
            'temperature': 20 + (i % 10),
            'humidity': 50 + (i % 20)
        }
    })

# Upload in batches
response = requests.post(
    f'{BASE_URL}/api/v1/{ACCESS_TOKEN}/telemetry',
    json=data_points
)

print(f'Uploaded {len(data_points)} data points: {response.status_code}')
```

## Additional Resources

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Official API Docs**: https://thingsboard.io/docs/reference/rest-api/
- **Device API Docs**: https://thingsboard.io/docs/reference/http-api/
- **MQTT API Docs**: https://thingsboard.io/docs/reference/mqtt-api/
- **Architecture Guide**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

Last updated: 2025-11-17
