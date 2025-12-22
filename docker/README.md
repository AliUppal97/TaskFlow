# TaskFlow Docker Configuration

This directory contains advanced Docker configurations for TaskFlow deployment in various environments.

## Directory Structure

```
docker/
├── README.md                    # This file
├── nginx.conf                   # Nginx config for frontend (development)
├── nginx-proxy.conf             # Nginx reverse proxy (production)
├── frontend.prod.Dockerfile     # Production frontend Dockerfile with Nginx
├── docker-compose.prod.yml      # Production Docker Compose
├── env.prod.template            # Production environment template
└── init.sql                     # Database initialization script (optional)
```

## Configuration Files

### nginx.conf
Nginx configuration optimized for serving Next.js applications with:
- Gzip compression
- Security headers
- API proxying to backend
- WebSocket support
- Static asset caching

### nginx-proxy.conf
Advanced reverse proxy configuration for production with:
- SSL/TLS termination
- Separate domains for frontend and API
- Rate limiting
- Load balancing capabilities

### frontend.prod.Dockerfile
Production-ready Dockerfile for the frontend using Nginx instead of Node.js for better performance and resource usage.

### docker-compose.prod.yml
Production Docker Compose configuration with:
- Resource limits and reservations
- Health checks
- Proper service dependencies
- Optional nginx proxy service

## Usage

### Production Deployment

1. **Prepare environment variables:**
   ```bash
   cp env.prod.template .env.prod
   # Edit .env.prod with your production values
   ```

2. **Deploy with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

3. **Deploy with nginx proxy (optional):**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod --profile proxy up -d
   ```

### SSL Configuration

For SSL/TLS with the nginx proxy:

1. **Obtain SSL certificates:**
   ```bash
   # Using Let's Encrypt
   certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
   ```

2. **Create SSL directory and copy certificates:**
   ```bash
   mkdir ssl
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
   ```

3. **Update nginx-proxy.conf:**
   - Replace `yourdomain.com` with your actual domain
   - Ensure SSL paths are correct

### Database Initialization

If you need to initialize the database with custom scripts:

1. **Create init.sql:**
   ```sql
   -- Custom database initialization
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   -- Add your custom SQL here
   ```

2. **The init.sql will be automatically loaded on first startup**

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_USERNAME` | PostgreSQL username | `taskflow_prod` |
| `DATABASE_PASSWORD` | PostgreSQL password | `secure_password` |
| `DATABASE_NAME` | PostgreSQL database name | `taskflow_prod` |
| `MONGO_DATABASE` | MongoDB database name | `taskflow_prod` |
| `REDIS_PASSWORD` | Redis password | `secure_redis_pass` |
| `JWT_ACCESS_SECRET` | JWT access token secret | `32+char_secret` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `32+char_secret` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `https://api.yourdomain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_PORT` | Frontend port | `80` |
| `NGINX_PORT` | Nginx HTTPS port | `443` |
| `NGINX_HTTP_PORT` | Nginx HTTP port | `80` |
| `LOG_LEVEL` | Application log level | `info` |

## Security Considerations

1. **Use strong passwords** for all databases and services
2. **Enable SSL/TLS** in production
3. **Restrict network access** between containers
4. **Regularly update** base images
5. **Monitor resource usage** and adjust limits as needed
6. **Use secrets management** for sensitive data in production

## Troubleshooting

### Common Issues

1. **Container fails to start:**
   - Check logs: `docker-compose logs <service_name>`
   - Verify environment variables
   - Check health checks: `docker ps`

2. **Database connection issues:**
   - Ensure services start in correct order
   - Check network connectivity: `docker network ls`
   - Verify database credentials

3. **SSL certificate issues:**
   - Check certificate paths in nginx config
   - Verify certificate validity: `openssl x509 -in cert.pem -text`
   - Check nginx error logs

### Health Checks

All services include health checks. Monitor them with:
```bash
docker ps
docker-compose ps
```

### Logs

View logs for all services:
```bash
docker-compose logs -f
```

View logs for specific service:
```bash
docker-compose logs -f <service_name>
```

## Performance Tuning

### Resource Limits

Adjust resource limits in `docker-compose.prod.yml` based on your server capacity:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Database Tuning

For PostgreSQL performance:
- Adjust `shared_buffers` and `work_mem`
- Configure connection pooling
- Set up proper indexing

### Caching

Redis is configured for caching. Adjust Redis memory limits based on your needs.

## Backup and Recovery

### Database Backups

```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U ${DATABASE_USERNAME} ${DATABASE_NAME} > backup.sql

# MongoDB backup
docker-compose exec mongodb mongodump --db ${MONGO_DATABASE} --out /backup

# Redis backup (if using persistence)
docker-compose exec redis redis-cli save
```

### Volume Backups

```bash
# Backup volumes
docker run --rm -v taskflow_postgres_prod_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Monitoring

Consider integrating with monitoring solutions:

- **Prometheus** for metrics collection
- **Grafana** for dashboards
- **ELK Stack** for log aggregation
- **Sentry** for error tracking

## Scaling

For high-traffic deployments:

1. **Add more backend instances:**
   ```yaml
   backend:
     deploy:
       replicas: 3
   ```

2. **Use load balancer** in front of backend services

3. **Scale databases** appropriately for your load

4. **Implement CDN** for static assets

## Maintenance

### Updates

1. **Update base images:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

2. **Rolling updates:**
   ```bash
   docker-compose up -d --no-deps <service_name>
   ```

### Cleanup

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (WARNING: destroys data)
docker-compose down -v

# Clean up unused images
docker image prune -f
```
