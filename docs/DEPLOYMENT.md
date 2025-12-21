# TaskFlow Deployment Guide

## Overview

This guide covers deploying TaskFlow to various environments, from local development to production cloud deployments. TaskFlow supports multiple deployment strategies including Docker, cloud platforms, and traditional server deployments.

## Prerequisites

### System Requirements
- **Node.js**: 18+ (for local development)
- **Docker**: 20.10+ (for containerized deployment)
- **PostgreSQL**: 13+ (database)
- **MongoDB**: 6+ (event logging)
- **Redis**: 6+ (caching)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 20GB minimum for databases and logs

### Infrastructure Components
- **Load Balancer**: Nginx/Traefik for routing and SSL termination
- **Databases**: PostgreSQL primary, MongoDB for events, Redis for cache
- **File Storage**: Local/S3 for user uploads (future feature)
- **Monitoring**: Application and infrastructure monitoring
- **Backup**: Automated database backups

---

## Quick Start with Docker

### Local Development Setup

1. **Clone and Setup Environment**
   ```bash
   git clone https://github.com/your-org/taskflow.git
   cd taskflow
   cp backend/env.template backend/.env
   ```

2. **Configure Environment Variables**
   ```bash
   # Edit backend/.env with your settings
   NODE_ENV=development
   PORT=3001
   CORS_ORIGIN=http://localhost:3000

   # Database settings
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=password
   DATABASE_NAME=taskflow

   # Add other required variables...
   ```

3. **Start with Docker Compose**
   ```bash
   # Start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop services
   docker-compose down
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: taskflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB for Event Logs
  mongodb:
    image: mongo:6-jammy
    environment:
      MONGO_INITDB_DATABASE: taskflow
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - ./backend/.env
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
```

### Dockerfiles

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

# Install system dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

USER nestjs

EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/out /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration
```nginx
# frontend/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    server {
        listen 3000;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health check
        location /api/health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## Production Deployment

### Environment Configuration

#### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com

# Database
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-db-user
DATABASE_PASSWORD=your-secure-db-password
DATABASE_NAME=taskflow_prod
DATABASE_SSL=true

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/taskflow_prod

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password
REDIS_DB=0

# JWT (Use strong, unique secrets)
JWT_ACCESS_SECRET=your-super-secure-access-secret-here-32-chars-min
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here-32-chars-min
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=your-sentry-dsn-here
PROMETHEUS_METRICS=true
```

### SSL/TLS Configuration

#### Let's Encrypt with Certbot
```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Automatic renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

#### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com api.yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Frontend (port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API (port 3001)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Database Setup

#### PostgreSQL Production Configuration
```sql
-- Create production database
CREATE DATABASE taskflow_prod;
CREATE USER taskflow_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE taskflow_prod TO taskflow_user;

-- Enable extensions
\c taskflow_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set permissions
GRANT USAGE ON SCHEMA public TO taskflow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO taskflow_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO taskflow_user;
```

#### MongoDB Atlas Setup
```javascript
// MongoDB connection string format
mongodb+srv://username:password@cluster.mongodb.net/taskflow_prod?retryWrites=true&w=majority

// Create database user
db.createUser({
  user: 'taskflow_prod',
  pwd: 'secure_password',
  roles: [
    { role: 'readWrite', db: 'taskflow_prod' }
  ]
});
```

### Process Management

#### PM2 Configuration
```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'taskflow-backend',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### Systemd Service
```ini
# /etc/systemd/system/taskflow-backend.service
[Unit]
Description=TaskFlow Backend API
After=network.target

[Service]
Type=simple
User=taskflow
Group=taskflow
WorkingDirectory=/opt/taskflow/backend
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/opt/taskflow
ProtectHome=yes

[Install]
WantedBy=multi-user.target
```

---

## Cloud Platform Deployments

### AWS Deployment

#### Infrastructure as Code (Terraform)
```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC Configuration
resource "aws_vpc" "taskflow" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "taskflow-vpc"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "taskflow" {
  name = "taskflow-cluster"
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "taskflow-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "your-registry/taskflow-backend:latest"

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" },
        # Add other environment variables
      ]

      secrets = [
        {
          name      = "DATABASE_PASSWORD"
          valueFrom = aws_ssm_parameter.db_password.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/taskflow-backend"
          awslogs-region        = "us-east-1"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t3.micro"
  db_name             = "taskflow"
  username            = "postgres"
  password            = random_password.db_password.result
  parameter_group_name = "default.postgres15"
  skip_final_snapshot = true

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.default.name
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "taskflow-redis"
  engine              = "redis"
  node_type           = "cache.t3.micro"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  port                = 6379
}

# Application Load Balancer
resource "aws_lb" "taskflow" {
  name               = "taskflow-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public.*.id
}

# API Gateway (optional)
resource "aws_apigatewayv2_api" "taskflow" {
  name          = "taskflow-api"
  protocol_type = "HTTP"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "taskflow" {
  origin {
    domain_name = aws_lb.taskflow.dns_name
    origin_id   = "taskflow-alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "taskflow-alb"

    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # SSL certificate
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.cert.arn
    ssl_support_method  = "sni-only"
  }
}
```

#### AWS Deployment Script
```bash
#!/bin/bash
# deploy.sh

# Build and push Docker images
docker build -t your-registry/taskflow-backend:latest ./backend
docker build -t your-registry/taskflow-frontend:latest ./frontend

docker push your-registry/taskflow-backend:latest
docker push your-registry/taskflow-frontend:latest

# Deploy to ECS
aws ecs update-service \
  --cluster taskflow-cluster \
  --service taskflow-backend \
  --force-new-deployment

# Run database migrations
aws ecs run-task \
  --cluster taskflow-cluster \
  --task-definition taskflow-migration \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345]}"
```

### Google Cloud Platform (GCP)

#### Cloud Run Deployment
```yaml
# backend/cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: taskflow-backend
spec:
  template:
    spec:
      containers:
      - image: gcr.io/your-project/taskflow-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        resources:
          limits:
            cpu: "1000m"
            memory: "1Gi"
---
# frontend/cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: taskflow-frontend
spec:
  template:
    spec:
      containers:
      - image: gcr.io/your-project/taskflow-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://taskflow-backend-xxxx.a.run.app"
```

#### GKE Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taskflow-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: taskflow-backend
  template:
    metadata:
      labels:
        app: taskflow-backend
    spec:
      containers:
      - name: backend
        image: gcr.io/your-project/taskflow-backend:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: taskflow-config
        - secretRef:
            name: taskflow-secrets
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Microsoft Azure

#### Azure Container Apps
```bash
# Deploy backend
az containerapp create \
  --name taskflow-backend \
  --resource-group taskflow-rg \
  --environment taskflow-env \
  --image your-registry/taskflow-backend:latest \
  --target-port 3001 \
  --ingress external \
  --env-vars NODE_ENV=production PORT=3001 \
  --cpu 0.5 \
  --memory 1Gi \
  --min-replicas 1 \
  --max-replicas 10

# Deploy frontend
az containerapp create \
  --name taskflow-frontend \
  --resource-group taskflow-rg \
  --environment taskflow-env \
  --image your-registry/taskflow-frontend:latest \
  --target-port 3000 \
  --ingress external \
  --env-vars NEXT_PUBLIC_API_URL=https://taskflow-backend.azurecontainerapps.io \
  --cpu 0.25 \
  --memory 0.5Gi
```

#### AKS Deployment
```yaml
# aks/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taskflow-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: taskflow-backend
  template:
    metadata:
      labels:
        app: taskflow-backend
    spec:
      containers:
      - name: backend
        image: your-registry/taskflow-backend:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: taskflow-config
        - secretRef:
            name: taskflow-secrets
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

---

## Monitoring and Observability

### Application Monitoring

#### Prometheus Metrics
```typescript
// backend/src/app.service.ts
import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Gauge, Counter } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestTotal: Counter<string>;
  private readonly activeConnections: Gauge<string>;

  constructor() {
    // Enable default metrics
    collectDefaultMetrics();

    // Custom metrics
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.activeConnections = new Gauge({
      name: 'websocket_active_connections',
      help: 'Number of active WebSocket connections',
    });
  }

  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  async getMetrics() {
    return register.metrics();
  }
}
```

#### Health Checks
```typescript
// backend/src/app.controller.ts
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get('health')
  @HealthCheck()
  check() {
    return HealthCheckService
      .getBuilder()
      .addCheck('database', () => this.checkDatabase())
      .addCheck('redis', () => this.checkRedis())
      .addCheck('mongodb', () => this.checkMongoDB())
      .build()
      .check();
  }

  @Get('metrics')
  async getMetrics() {
    return this.metricsService.getMetrics();
  }

  @Get('ready')
  readiness() {
    // Check if application is ready to serve traffic
    return { status: 'ok' };
  }
}
```

### Logging Configuration

#### Winston Logger Setup
```typescript
// backend/src/common/services/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as Transport from 'winston-transport';

@Injectable()
export class WinstonLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const transports: Transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
    ];

    // Add file transport in production
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports,
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, stack?: string, context?: string) {
    this.logger.error(message, { stack, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

### Centralized Logging

#### ELK Stack Configuration
```yaml
# docker-compose.logging.yml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch
    ports:
      - "5000:5000"

  kibana:
    image: kibana:8.5.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    ports:
      - "5601:5601"
```

### Error Tracking

#### Sentry Integration
```typescript
// backend/src/common/services/sentry.service.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Console(),
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// Error boundary for unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  Sentry.captureException(reason);
});

process.on('uncaughtException', (error) => {
  Sentry.captureException(error);
});
```

---

## Backup and Recovery

### Database Backup Strategy

#### PostgreSQL Backup
```bash
#!/bin/bash
# backup-postgres.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/taskflow_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -f $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to cloud storage (optional)
# aws s3 cp ${BACKUP_FILE}.gz s3://your-backup-bucket/postgres/

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "PostgreSQL backup completed: ${BACKUP_FILE}.gz"
```

#### MongoDB Backup
```bash
#!/bin/bash
# backup-mongodb.sh

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/taskflow_${DATE}"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mongodump --db taskflow --out $BACKUP_FILE

# Compress backup
tar -czf ${BACKUP_FILE}.tar.gz -C $BACKUP_DIR $(basename $BACKUP_FILE)

# Upload to cloud storage (optional)
# aws s3 cp ${BACKUP_FILE}.tar.gz s3://your-backup-bucket/mongodb/

# Cleanup
rm -rf $BACKUP_FILE

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "MongoDB backup completed: ${BACKUP_FILE}.tar.gz"
```

### Automated Backup Schedule
```bash
# Add to crontab for automated backups
# Daily backups at 2 AM
0 2 * * * /path/to/backup-postgres.sh
0 3 * * * /path/to/backup-mongodb.sh

# Weekly full backup on Sunday
0 4 * * 0 /path/to/backup-full.sh
```

### Disaster Recovery

#### Recovery Procedures
```bash
#!/bin/bash
# restore-postgres.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop application
docker-compose stop backend

# Restore database
gunzip -c $BACKUP_FILE | psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Start application
docker-compose start backend

echo "PostgreSQL restore completed from: $BACKUP_FILE"
```

#### Recovery Time Objective (RTO)
- **Database Recovery**: 2 hours
- **Application Recovery**: 30 minutes
- **Full System Recovery**: 4 hours

#### Recovery Point Objective (RPO)
- **Transactional Data**: 1 hour
- **Event Logs**: 6 hours
- **File Attachments**: 24 hours

---

## Performance Optimization

### CDN Configuration

#### CloudFront Distribution
```typescript
// frontend/next.config.js
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
    loader: 'cloudinary',
    path: 'https://your-cdn-domain.com/_next/image',
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://your-cdn-domain.com' : '',
};
```

### Database Optimization

#### Connection Pooling
```typescript
// backend/src/config/database.config.ts
export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  // ... other config
  extra: {
    max: 20,              // Maximum connections
    min: 5,               // Minimum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    acquireTimeoutMillis: 60000,
  },
});
```

### Caching Strategy

#### Multi-Level Caching
```typescript
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private redisService: RedisService,
  ) {}

  async getWithFallback<T>(key: string, fetcher: () => Promise<T>, ttl = 300): Promise<T> {
    // Try L1 cache (in-memory)
    const cached = await this.cacheManager.get<T>(key);
    if (cached) return cached;

    // Try L2 cache (Redis)
    const redisCached = await this.redisService.get(key);
    if (redisCached) {
      await this.cacheManager.set(key, redisCached, ttl);
      return redisCached;
    }

    // Fetch from source
    const data = await fetcher();

    // Cache in both levels
    await this.cacheManager.set(key, data, ttl);
    await this.redisService.set(key, data, ttl);

    return data;
  }
}
```

---

## Security Hardening

### Container Security

#### Docker Security Best Practices
```dockerfile
# Use non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

# Minimize attack surface
RUN apk add --no-cache dumb-init curl
RUN rm -rf /var/cache/apk/*

# Use specific versions
FROM node:18.17.0-alpine3.18

# Multi-stage build
FROM node:18-alpine AS builder
# ... build stage

FROM node:18-alpine AS production
COPY --from=builder /app/dist ./dist
# ... production stage
```

### Network Security

#### Security Groups (AWS)
```hcl
resource "aws_security_group" "backend" {
  name_prefix = "taskflow-backend-"

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # VPC only
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "taskflow-rds-"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }
}
```

### Secrets Management

#### AWS Secrets Manager
```typescript
// backend/src/config/secrets.config.ts
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

export class SecretsService {
  private secretsManager = new SecretsManager({ region: 'us-east-1' });

  async getSecret(secretName: string): Promise<string> {
    const response = await this.secretsManager.getSecretValue({ SecretId: secretName });
    return response.SecretString!;
  }

  async getDatabaseCredentials() {
    const secret = await this.getSecret('taskflow/database');
    return JSON.parse(secret);
  }

  async getJwtSecrets() {
    const secret = await this.getSecret('taskflow/jwt');
    return JSON.parse(secret);
  }
}
```

---

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Test database connectivity
psql -h localhost -U postgres -d taskflow -c "SELECT 1;"

# Check connection pool status
docker-compose exec postgres pg_stat_activity;

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### Application Startup Issues
```bash
# Check application logs
docker-compose logs backend

# Test health endpoint
curl http://localhost:3001/health

# Check environment variables
docker-compose exec backend env | grep -E "(NODE_ENV|PORT|DATABASE)"
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check database performance
docker-compose exec postgres pg_stat_statements;

# Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM tasks WHERE status = 'in_progress';
```

### Monitoring Dashboards

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "TaskFlow Monitoring",
    "panels": [
      {
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count{datname='taskflow'}",
            "legendFormat": "Active Connections"
          }
        ]
      },
      {
        "title": "WebSocket Connections",
        "type": "singlestat",
        "targets": [
          {
            "expr": "websocket_active_connections",
            "legendFormat": "Active WS Connections"
          }
        ]
      }
    ]
  }
}
```

This comprehensive deployment guide provides multiple options for deploying TaskFlow across different environments and cloud platforms, ensuring scalability, security, and maintainability.



