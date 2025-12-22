# TaskFlow Docker Documentation

This comprehensive guide covers the complete Docker setup for TaskFlow, including development, production deployments, and advanced configurations.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Configuration Files](#configuration-files)
- [Docker Images](#docker-images)
- [Environment Variables](#environment-variables)
- [Networking](#networking)
- [Security](#security)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)
- [Performance Tuning](#performance-tuning)
- [CI/CD Integration](#cicd-integration)

## Overview

TaskFlow uses a microservices architecture with the following components:

- **Backend API** (NestJS): Main application server with REST API and WebSocket support
- **Frontend** (Next.js): React-based web application
- **PostgreSQL**: Primary relational database
- **MongoDB**: Document database for event logging
- **Redis**: Caching and session storage

All components are containerized using Docker for consistent deployment across environments.

## Prerequisites

### System Requirements

- **Docker**: 20.10+ (with Docker Compose)
- **Docker Compose**: 2.0+
- **Memory**: 4GB minimum, 8GB recommended
- **Storage**: 10GB minimum for images and data
- **CPU**: 2 cores minimum, 4 cores recommended

### Installation

#### Windows
```powershell
# Install Docker Desktop
winget install --id Docker.DockerDesktop
```

#### macOS
```bash
# Install Docker Desktop
brew install --cask docker
```

#### Linux
```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Quick Start

### Development Environment

```bash
# Clone the repository
git clone https://github.com/your-org/taskflow.git
cd taskflow

# Start development environment
./scripts/docker-quickstart.ps1
# or on Linux/Mac:
./scripts/docker-deploy.sh dev

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Production Deployment

```bash
# Prepare environment
cp docker/env.prod.template docker/.env.prod
# Edit docker/.env.prod with your settings

# Deploy production environment
./scripts/docker-deploy.sh prod
```

## Architecture

### Service Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend API   │
│   (Next.js)     │    │   (NestJS)      │
│   Port: 3000    │    │   Port: 3000    │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼──────────────────────┐
                                 │                      │
                    ┌────────────▼────────────┐    ┌────▼────────────┐
                    │    PostgreSQL          │    │    MongoDB      │
                    │    Port: 5432          │    │    Port: 27017   │
                    └─────────────────────────┘    └─────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       Redis            │
                    │    Port: 6379          │
                    └─────────────────────────┘
```

### Network Architecture

All services communicate through a Docker network (`taskflow-network`):

- **Internal Communication**: Services use service names as hostnames
- **External Access**: Only frontend (port 3000) and backend (port 3001) expose ports
- **Database Security**: Databases are not exposed externally

## Development Setup

### Using Docker Compose (Development)

The development setup uses volume mounting for hot reloading:

```yaml
# docker-compose.dev.yml
backend:
  volumes:
    - ./backend:/app
    - /app/node_modules
  command: npm run start:dev

frontend:
  volumes:
    - ./frontend:/app
    - /app/node_modules
    - /app/.next
  command: npm run dev
```

### Development Workflow

1. **Start Services**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **View Logs**:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

3. **Stop Services**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Development Tools

- **Hot Reloading**: Changes to source code automatically reload
- **Debugging**: Attach debugger to running containers
- **Testing**: Run tests inside containers
- **Database Access**: Connect to databases from host machine

## Production Deployment

### Single Server Deployment

For small to medium applications, deploy all services on a single server:

```bash
# Build and deploy
./scripts/docker-deploy.sh prod

# Check status
./scripts/docker-deploy.sh status

# View logs
./scripts/docker-deploy.sh logs
```

### Multi-Server Deployment

For high-traffic applications, distribute services across multiple servers:

```yaml
# Server 1: Frontend + Backend
# Server 2: PostgreSQL + Redis
# Server 3: MongoDB
```

### Load Balancing

Use nginx or Traefik for load balancing multiple instances:

```yaml
# docker-compose.scale.yml
backend:
  deploy:
    replicas: 3
    restart_policy:
      condition: on-failure

frontend:
  deploy:
    replicas: 2
```

## Configuration Files

### Docker Compose Files

| File | Purpose | Environment |
|------|---------|-------------|
| `docker-compose.yml` | Base configuration | Development |
| `docker-compose.dev.yml` | Development overrides | Development |
| `docker-compose.override.yml` | Development settings | Development |
| `docker/docker-compose.prod.yml` | Production configuration | Production |

### Dockerfile Locations

| Service | Dockerfile | Purpose |
|---------|------------|---------|
| Backend | `backend/Dockerfile` | Multi-stage Node.js build |
| Frontend | `frontend/Dockerfile` | Development with Node.js |
| Frontend (Prod) | `docker/frontend.prod.Dockerfile` | Production with Nginx |

### Configuration Files

| File | Purpose |
|------|---------|
| `docker/nginx.conf` | Nginx config for frontend |
| `docker/nginx-proxy.conf` | Reverse proxy configuration |
| `docker/env.prod.template` | Production environment template |
| `docker/README.md` | Docker directory documentation |

## Docker Images

### Backend Image

**Base Image**: `node:18-alpine`
**Stages**: builder, production
**Features**:
- Multi-stage build for smaller final image
- Non-root user for security
- Health checks
- Proper signal handling

### Frontend Images

**Development**: `node:18-alpine` with hot reloading
**Production**: `nginx:alpine` for static file serving

### Database Images

- **PostgreSQL**: `postgres:15-alpine` with health checks
- **MongoDB**: `mongo:6-jammy` with authentication
- **Redis**: `redis:7-alpine` with persistence

## Environment Variables

### Required Variables

| Variable | Service | Description | Example |
|----------|---------|-------------|---------|
| `DATABASE_HOST` | Backend | PostgreSQL hostname | `postgres` |
| `DATABASE_PORT` | Backend | PostgreSQL port | `5432` |
| `DATABASE_USERNAME` | Backend | Database username | `taskflow` |
| `DATABASE_PASSWORD` | Backend | Database password | `secure_pass` |
| `DATABASE_NAME` | Backend | Database name | `taskflow_prod` |
| `MONGODB_URI` | Backend | MongoDB connection string | `mongodb://mongodb:27017/taskflow` |
| `REDIS_HOST` | Backend | Redis hostname | `redis` |
| `REDIS_PORT` | Backend | Redis port | `6379` |
| `JWT_ACCESS_SECRET` | Backend | JWT access token secret | `32+char_secret` |
| `JWT_REFRESH_SECRET` | Backend | JWT refresh token secret | `32+char_secret` |
| `CORS_ORIGIN` | Backend | Allowed CORS origins | `https://yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API URL | `https://api.yourdomain.com` |

### Optional Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `NODE_ENV` | Backend | `development` | Application environment |
| `PORT` | Backend | `3000` | Backend port |
| `LOG_LEVEL` | Backend | `info` | Logging level |
| `DATABASE_SSL` | Backend | `false` | Enable SSL for database |
| `REDIS_PASSWORD` | Backend | `""` | Redis password |
| `JWT_ACCESS_EXPIRES_IN` | Backend | `15m` | JWT access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | Backend | `7d` | JWT refresh token expiry |
| `SMTP_HOST` | Backend | `""` | SMTP server for emails |
| `SENTRY_DSN` | Backend | `""` | Sentry error tracking |
| `FRONTEND_PORT` | Frontend | `80` | Frontend port (nginx) |

## Networking

### Docker Networks

```yaml
networks:
  taskflow-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Port Mappings

| Service | Internal Port | External Port | Protocol |
|---------|---------------|---------------|----------|
| Frontend | 3000 | 3000 | HTTP |
| Backend | 3000 | 3001 | HTTP |
| PostgreSQL | 5432 | 5432 | TCP |
| MongoDB | 27017 | 27017 | TCP |
| Redis | 6379 | 6379 | TCP |

### Service Discovery

Services communicate using service names as hostnames:

```javascript
// Backend connects to databases
const dbConfig = {
  host: process.env.DATABASE_HOST || 'postgres',
  port: process.env.DATABASE_PORT || 5432,
};
```

## Security

### Container Security

1. **Non-root Users**:
   ```dockerfile
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nestjs -u 1001
   USER nestjs
   ```

2. **Minimal Base Images**: Using Alpine Linux variants

3. **No Sensitive Data in Images**: Environment variables for secrets

### Network Security

1. **Internal Networking**: Databases not exposed externally
2. **Firewall Rules**: Restrict access to necessary ports only
3. **SSL/TLS**: Enable HTTPS in production

### Secrets Management

```yaml
# docker-compose.prod.yml
backend:
  secrets:
    - jwt_access_secret
    - jwt_refresh_secret
    - database_password

secrets:
  jwt_access_secret:
    environment: "JWT_ACCESS_SECRET"
  jwt_refresh_secret:
    environment: "JWT_REFRESH_SECRET"
  database_password:
    environment: "DATABASE_PASSWORD"
```

## Monitoring & Logging

### Health Checks

All services include health checks:

```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Logging Configuration

```yaml
# Centralized logging
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

### Monitoring Integration

- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **ELK Stack**: Log aggregation and analysis
- **Sentry**: Error tracking

## Backup & Recovery

### Database Backups

```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U postgres taskflow > backup.sql

# MongoDB backup
docker-compose exec mongodb mongodump --db taskflow --out /backup

# Redis backup (if using persistence)
docker-compose exec redis redis-cli save
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

### Recovery Procedures

1. **Stop Application**:
   ```bash
   docker-compose down
   ```

2. **Restore Database**:
   ```bash
   docker-compose exec -T postgres psql -U postgres taskflow < backup.sql
   ```

3. **Start Application**:
   ```bash
   docker-compose up -d
   ```

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check logs
docker-compose logs <service_name>

# Check container status
docker-compose ps

# Check resource usage
docker stats
```

#### Database Connection Issues

```bash
# Test database connectivity
docker-compose exec postgres pg_isready -U postgres

# Check database logs
docker-compose logs postgres
```

#### Port Conflicts

```bash
# Check what's using ports
netstat -tulpn | grep :3000

# Change port mappings in compose file
ports:
  - "3001:3000"  # host:container
```

#### Performance Issues

```bash
# Check resource usage
docker stats

# Monitor container metrics
docker-compose exec backend npm run pm2:monit
```

### Debug Mode

```bash
# Start with debug logging
NODE_ENV=development LOG_LEVEL=debug docker-compose up

# Attach debugger
docker-compose exec backend node --inspect-brk=0.0.0.0:9229 dist/main.js
```

### Reset Everything

```bash
# Stop and remove everything
docker-compose down -v --remove-orphans

# Clean up images and volumes
docker system prune -a
docker volume prune
```

## Performance Tuning

### Resource Limits

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### Database Optimization

```yaml
postgres:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
    POSTGRES_WORK_MEM: 4MB
```

### Caching Configuration

```yaml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Connection Pooling

```typescript
// backend/src/config/database.config.ts
const dbConfig = {
  extra: {
    max: 20,              // Maximum connections
    min: 5,               // Minimum connections
    idleTimeoutMillis: 30000,
  },
};
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: your-org/taskflow-backend:latest

    - name: Build and push frontend
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: your-org/taskflow-frontend:latest
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                script {
                    docker.build('taskflow-backend', './backend')
                    docker.build('taskflow-frontend', './frontend')
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    docker.image('taskflow-backend').inside {
                        sh 'npm test'
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    docker.withRegistry('https://registry.example.com', 'registry-credentials') {
                        docker.image('taskflow-backend').push('latest')
                        docker.image('taskflow-frontend').push('latest')
                    }
                }
            }
        }
    }
}
```

### Deployment Strategies

1. **Rolling Updates**:
   ```bash
   docker-compose up -d --no-deps backend
   ```

2. **Blue-Green Deployment**:
   ```bash
   # Start new version
   docker-compose -f docker-compose.green.yml up -d

   # Switch traffic (update nginx config)
   # Stop old version
   docker-compose -f docker-compose.blue.yml down
   ```

3. **Canary Deployment**:
   ```bash
   # Route 10% traffic to new version
   # Gradually increase traffic
   # Monitor metrics and errors
   ```

## Scripts and Tools

### Build Scripts

```bash
# Build all images
./scripts/docker-build.sh

# Build specific service
./scripts/docker-build.sh --backend
./scripts/docker-build.sh --frontend
```

### Deployment Scripts

```bash
# Deploy development
./scripts/docker-deploy.sh dev

# Deploy production
./scripts/docker-deploy.sh prod

# Deploy with nginx proxy
./scripts/docker-deploy.sh proxy

# View logs
./scripts/docker-deploy.sh logs

# Stop all services
./scripts/docker-deploy.sh stop
```

### Windows PowerShell

```powershell
# Quick start (Windows)
.\scripts\docker-quickstart.ps1

# Production deployment
.\scripts\docker-quickstart.ps1 -Environment prod -Build
```

## Best Practices

### Development

1. **Use development overrides** for hot reloading
2. **Mount source code** as volumes for live updates
3. **Share node_modules** between host and container
4. **Use .dockerignore** to exclude unnecessary files

### Production

1. **Use multi-stage builds** for smaller images
2. **Run as non-root user** for security
3. **Implement health checks** for all services
4. **Use environment variables** for configuration
5. **Enable logging and monitoring**

### Security

1. **Scan images** for vulnerabilities
2. **Use secrets management** for sensitive data
3. **Keep base images updated**
4. **Implement network segmentation**
5. **Use HTTPS in production**

### Performance

1. **Set resource limits** appropriately
2. **Use connection pooling** for databases
3. **Implement caching** strategies
4. **Optimize Docker images** size
5. **Monitor resource usage**

## Migration Guide

### From Local Development to Docker

1. **Install Docker** on development machines
2. **Create Dockerfiles** for each service
3. **Set up docker-compose.yml** for local development
4. **Migrate environment variables** to .env files
5. **Update documentation** and scripts

### From Docker to Kubernetes

1. **Convert compose files** to Kubernetes manifests
2. **Set up ConfigMaps** and Secrets
3. **Configure Services** and Ingress
4. **Implement health checks** and probes
5. **Set up monitoring** and logging

## Support

### Getting Help

1. **Check logs**: `docker-compose logs`
2. **View container status**: `docker-compose ps`
3. **Check resource usage**: `docker stats`
4. **Review documentation**: `docker/README.md`

### Common Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment)

---

This documentation provides comprehensive coverage of TaskFlow's Docker setup. For specific questions or issues, please check the logs and refer to the troubleshooting section above.
