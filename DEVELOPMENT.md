# Development Guide

This guide will help you set up a local development environment for ThingsBoard.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Issues](#common-issues)

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Purpose |
|----------|----------------|-------------|---------|
| **Java JDK** | 17 | 17 or 21 | Backend development |
| **Maven** | 3.6.0 | 3.8+ | Build tool |
| **Node.js** | 18.0 | 20+ LTS | Frontend development |
| **npm** | 8.0 | 10+ | Package manager |
| **PostgreSQL** | 13 | 15+ | Database |
| **Git** | 2.25 | Latest | Version control |

### Optional Software

| Software | Purpose |
|----------|---------|
| **Docker** | Containerized database and services |
| **IntelliJ IDEA** | Recommended Java IDE |
| **VS Code** | Recommended for frontend development |
| **Redis** | Cache and message broker (optional) |

### System Requirements

- **RAM**: Minimum 8GB, Recommended 16GB+
- **Disk Space**: At least 10GB free
- **OS**: Linux, macOS, or Windows (WSL2 recommended for Windows)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/thingsboard/thingsboard.git
cd thingsboard
```

### 2. Set Up Database

**Option A: Using Docker (Recommended for development)**
```bash
docker run -d \
  --name tb-postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=thingsboard \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:15
```

**Option B: Install PostgreSQL Locally**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-15

# macOS
brew install postgresql@15

# Create database
createdb thingsboard
```

### 3. Build Backend

```bash
# Full build with tests
mvn clean install

# Quick build without tests (faster)
mvn clean install -DskipTests
```

### 4. Set Up Frontend

```bash
cd frontend-react
npm install
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
java -jar application/target/thingsboard-*.jar
```

**Terminal 2 - Frontend:**
```bash
cd frontend-react
npm run dev
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/swagger-ui.html

## Backend Setup

### Project Structure

```
thingsboard/
├── application/          # Main Spring Boot application
├── dao/                 # Data Access Layer
├── common/              # Common utilities and models
│   ├── data/           # Data models
│   ├── message/        # Message queue
│   ├── transport/      # Transport protocols
│   └── util/           # Utilities
├── rule-engine/         # Rule engine implementation
├── transport/           # Protocol implementations
│   ├── http/           # HTTP transport
│   ├── mqtt/           # MQTT transport
│   └── coap/           # CoAP transport
├── msa/                # Microservices architecture
├── backend-python/      # Python backend services
└── tools/              # Development tools
```

### Building Modules

```bash
# Build specific module
mvn clean install -pl dao -am

# Build without integration tests
mvn clean install -DskipTests

# Build with specific profile
mvn clean install -P hsqldb
```

### Configuration

Backend configuration files are located in `application/src/main/resources/`.

**Key configuration files:**
- `thingsboard.yml` - Main application configuration
- `application.properties` - Spring Boot properties
- `logback.xml` - Logging configuration

**Environment Variables:**

Create a `.env` file or set environment variables:

```bash
# Database
export DATABASE_TYPE=sql
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/thingsboard
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres

# Server
export HTTP_BIND_PORT=8080
export HTTP_BIND_ADDRESS=0.0.0.0

# Redis (optional)
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

### Running Backend in IDE

**IntelliJ IDEA:**

1. Import project as Maven project
2. Wait for dependencies to download
3. Find `ThingsboardServerApplication.java` in `application/src/main/java/`
4. Right-click and select "Run" or "Debug"
5. Configure VM options if needed:
   ```
   -Xmx2G
   -Dserver.port=8080
   -Dspring.datasource.url=jdbc:postgresql://localhost:5432/thingsboard
   ```

**Eclipse:**

1. Import as "Existing Maven Project"
2. Right-click project → Run As → Java Application
3. Select `ThingsboardServerApplication` as main class

## Frontend Setup

### React Frontend Structure

```
frontend-react/
├── src/
│   ├── api/           # API client services
│   ├── components/    # React components
│   ├── features/      # Feature modules
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── store/         # Redux state management
│   ├── styles/        # Global styles
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── public/            # Static assets
└── package.json       # Dependencies
```

### Installing Dependencies

```bash
cd frontend-react
npm install

# Or use yarn
yarn install
```

### Development Server

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Frontend Configuration

Edit `frontend-react/vite.config.ts` to configure the development server:

```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

### Code Style

```bash
# Format all files
npm run format

# Lint TypeScript files
npm run lint

# Auto-fix lint issues
npm run lint -- --fix
```

## Database Setup

### PostgreSQL Setup

**Create database and user:**

```sql
CREATE DATABASE thingsboard;
CREATE USER thingsboard WITH ENCRYPTED PASSWORD 'thingsboard';
GRANT ALL PRIVILEGES ON DATABASE thingsboard TO thingsboard;
```

**Configure connection:**

Edit `application/src/main/resources/thingsboard.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/thingsboard
    username: thingsboard
    password: thingsboard
```

### Database Migrations

ThingsBoard uses SQL scripts for schema management located in:
- `application/src/main/data/sql/`

**Install schema:**

```bash
java -cp application/target/thingsboard-*.jar \
  org.thingsboard.server.ThingsboardInstallApplication \
  --install
```

### Using Docker for Database

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Or manually
docker run -d \
  --name tb-postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=thingsboard \
  -e POSTGRES_USER=thingsboard \
  -e POSTGRES_PASSWORD=thingsboard \
  -v tb-postgres-data:/var/lib/postgresql/data \
  postgres:15
```

## Running the Application

### Full Stack Development

**Option 1: Separate Terminals**

Terminal 1 - Backend:
```bash
cd application
mvn spring-boot:run
```

Terminal 2 - Frontend:
```bash
cd frontend-react
npm run dev
```

**Option 2: Using Docker Compose**

```bash
docker-compose up -d postgres redis
mvn spring-boot:run &
cd frontend-react && npm run dev
```

### Default Credentials

After installation, login with:
- **Username**: `sysadmin@thingsboard.org`
- **Password**: `sysadmin`

**IMPORTANT**: Change these credentials in production!

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the appropriate module

3. **Build and test**
   ```bash
   # Backend
   mvn clean install

   # Frontend
   cd frontend-react
   npm run build
   ```

4. **Run tests**
   ```bash
   # Backend unit tests
   mvn test

   # Specific module
   mvn test -pl dao

   # Frontend tests
   npm test
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

### Code Formatting

**Java:**
```bash
# Format with Maven
mvn formatter:format

# Or use IDE formatting (IntelliJ: Ctrl+Alt+L)
```

**TypeScript/React:**
```bash
cd frontend-react
npm run format
```

## Testing

### Backend Testing

**Run all tests:**
```bash
mvn clean test
```

**Run specific test class:**
```bash
mvn test -Dtest=DeviceServiceTest
```

**Run specific test method:**
```bash
mvn test -Dtest=DeviceServiceTest#testCreateDevice
```

**Run integration tests:**
```bash
mvn verify -P integration-tests
```

**Skip tests:**
```bash
mvn clean install -DskipTests
```

### Frontend Testing

```bash
cd frontend-react

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Coverage

```bash
# Backend coverage
mvn clean test jacoco:report

# Frontend coverage
cd frontend-react
npm test -- --coverage
```

## Debugging

### Backend Debugging

**IntelliJ IDEA:**
1. Set breakpoints in code
2. Right-click `ThingsboardServerApplication`
3. Select "Debug"

**VS Code:**
1. Install Java extensions
2. Create `.vscode/launch.json`:
   ```json
   {
     "type": "java",
     "name": "Debug ThingsBoard",
     "request": "launch",
     "mainClass": "org.thingsboard.server.ThingsboardServerApplication",
     "projectName": "application"
   }
   ```

**Remote Debugging:**
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
  -jar application/target/thingsboard-*.jar
```

Then attach debugger to port 5005.

### Frontend Debugging

**Browser DevTools:**
- Open Chrome/Firefox DevTools (F12)
- Use React Developer Tools extension
- Use Redux DevTools extension

**VS Code:**
1. Install "Debugger for Chrome" extension
2. Create `.vscode/launch.json`:
   ```json
   {
     "type": "chrome",
     "request": "launch",
     "name": "Debug Frontend",
     "url": "http://localhost:5173",
     "webRoot": "${workspaceFolder}/frontend-react/src"
   }
   ```

### Logging

**Backend:**

Edit `application/src/main/resources/logback.xml`:

```xml
<logger name="org.thingsboard" level="DEBUG"/>
<logger name="org.thingsboard.server.dao" level="TRACE"/>
```

**Frontend:**

Use console statements:
```typescript
console.log('Debug info:', data);
console.error('Error:', error);
```

## Common Issues

### Build Fails

**Issue**: Maven build fails with dependency errors

**Solution**:
```bash
mvn clean install -U  # Force update dependencies
rm -rf ~/.m2/repository  # Clear local repository
```

### Database Connection Failed

**Issue**: Cannot connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql -h localhost -U postgres -d thingsboard

# Verify configuration in thingsboard.yml
```

### Port Already in Use

**Issue**: Port 8080 or 5173 already in use

**Solution**:
```bash
# Find process using port
lsof -i :8080
netstat -ano | findstr :8080  # Windows

# Kill process or change port in configuration
```

### Frontend Not Connecting to Backend

**Issue**: API calls fail from frontend

**Solution**:
1. Check backend is running on port 8080
2. Verify proxy configuration in `vite.config.ts`
3. Check CORS settings in backend
4. Check browser console for errors

### Out of Memory

**Issue**: Java heap space error

**Solution**:
```bash
# Increase heap size
export MAVEN_OPTS="-Xmx2G"
mvn clean install

# Or for running application
java -Xmx2G -jar application/target/thingsboard-*.jar
```

### Tests Failing

**Issue**: Tests fail locally

**Solution**:
1. Ensure database is running
2. Check test configuration
3. Run single test to isolate issue:
   ```bash
   mvn test -Dtest=FailingTest
   ```
4. Check logs in `target/surefire-reports/`

## Additional Resources

- **Documentation**: https://thingsboard.io/docs/
- **API Reference**: http://localhost:8080/swagger-ui.html
- **Architecture Guide**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Contributing Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Need Help?

- Check [GitHub Issues](https://github.com/thingsboard/thingsboard/issues)
- Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/thingsboard) with tag `thingsboard`
- Read the [Documentation](https://thingsboard.io/docs/)

---

Happy coding! 🚀
