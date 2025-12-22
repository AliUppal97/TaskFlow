# Redis Caching Implementation Guide

## Overview

TaskFlow implements Redis as a high-performance caching layer to improve application performance, reduce database load, and enhance user experience. This document provides comprehensive information about the Redis caching implementation, configuration, and usage patterns.

## Architecture

### Cache Layer Components

1. **Cache Service** (`src/common/cache/cache.service.ts`)
   - Core caching abstraction layer
   - Redis operations (get, set, delete, pattern deletion)
   - Error handling with graceful degradation
   - Health monitoring capabilities

2. **Cache Decorators** (`src/common/cache/cache.decorators.ts`)
   - `@CacheResult`: Automatic result caching with TTL
   - `@InvalidateCache`: Cache invalidation on data mutations
   - `@CacheKey`: Custom cache key management

3. **Cache Types** (`src/common/cache/cache.types.ts`)
   - TypeScript interfaces for type safety
   - Redis store interface definitions

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost          # Redis server host
REDIS_PORT=6379              # Redis server port
REDIS_PASSWORD=               # Redis password (optional)
REDIS_DB=0                   # Redis database number
```

### Docker Configuration

Redis is configured in `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: taskflow-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Application Configuration

Redis is configured in the main application module (`src/app.module.ts`):

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const redisConfig = getRedisConfig(configService);
    return {
      store: redisStore as any,
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      ttl: redisConfig.ttl,
    };
  },
  inject: [ConfigService],
  isGlobal: true,
})
```

## Cache Usage Patterns

### 1. Method Result Caching

The `@CacheResult` decorator automatically caches method results:

```typescript
@CacheResult({ ttl: 300, keyPrefix: 'tasks:list' }) // 5 minutes cache
async findAll(query: TaskQueryDto, user: User): Promise<TaskListResponse> {
  // Complex database query
  // Results automatically cached
}
```

### 2. Cache Invalidation

The `@InvalidateCache` decorator clears cache patterns on data mutations:

```typescript
@InvalidateCache('task:*') // Clear all task-related caches
async create(createTaskDto: CreateTaskDto, creator: User): Promise<Task> {
  // Create task and invalidate related caches
}
```

### 3. Manual Cache Operations

Direct cache operations using the CacheService:

```typescript
// Store user data
await this.cacheService.set(
  this.cacheService.generateKey(CacheService.KEYS.USER, userId),
  userData,
  { ttl: 3600 } // 1 hour
);

// Retrieve cached data
const cachedUser = await this.cacheService.get(
  this.cacheService.generateKey(CacheService.KEYS.USER, userId)
);

// Delete specific cache entry
await this.cacheService.delete(
  this.cacheService.generateKey(CacheService.KEYS.USER, userId)
);

// Delete cache patterns
await this.cacheService.deletePattern('task:*');
```

## Cache Key Management

### Key Structure

Cache keys follow a consistent format: `prefix:part1:part2:part3`

```typescript
// Examples:
'user:123'                    // User data
'task:456'                    // Task data
'tasks:list:user:123:page:1'  // Paginated task list
'task:stats:user:123'         // Task statistics
```

### Predefined Key Constants

The `CacheService.KEYS` object provides centralized key naming:

```typescript
static readonly KEYS = {
  USER: 'user',
  TASK: 'task',
  TASKS_LIST: 'tasks:list',
  TASK_STATS: 'task:stats',
  REFRESH_TOKEN: 'refresh_token',
  BLACKLIST: 'blacklist',
} as const;
```

## Caching Strategies

### 1. Query Result Caching

Frequently accessed query results are cached with appropriate TTL:

- **Task Lists**: 5 minutes (frequent changes)
- **Task Details**: 10 minutes (moderate changes)
- **Task Statistics**: 5 minutes (aggregate data)
- **User Profiles**: 1 hour (infrequent changes)

### 2. Session Management

- **Refresh Tokens**: Stored in Redis with 7-day TTL
- **Access Token Blacklist**: Stored with token expiration TTL

### 3. Cache Invalidation Strategy

Cache invalidation occurs on data mutations:

- **Create Operations**: Invalidate list caches
- **Update Operations**: Invalidate specific item and list caches
- **Delete Operations**: Invalidate all related caches

## Performance Benefits

### Database Load Reduction

- Task list queries cached for 5 minutes
- Statistics queries cached for 5 minutes
- User profile queries cached for 1 hour

### Response Time Improvement

- Cached responses served in ~1-5ms vs database queries in ~50-200ms
- Reduced database connection pool usage
- Improved concurrent user handling

### Scalability Enhancement

- Horizontal scaling support through Redis clustering
- Session persistence across application instances
- Reduced memory pressure on application servers

## Monitoring and Health Checks

### Health Check Endpoint

The `/health` endpoint includes cache status:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "cache": {
      "connected": true,
      "type": "RedisStore"
    }
  }
}
```

### Cache Service Health Methods

```typescript
// Check if Redis is healthy
const isHealthy = await this.cacheService.isHealthy();

// Get cache statistics
const stats = await this.cacheService.getStats();
```

### Logging

Cache operations are logged at debug level:

```
[CacheService] Cache hit for key: task:123
[CacheService] Cache miss for key: task:456
[CacheService] Cache set for key: task:123, TTL: 600
```

## Error Handling

### Graceful Degradation

Cache failures don't break the application:

- Cache misses fall back to database queries
- Cache write failures are logged but don't throw errors
- Application continues to function without caching

### Error Scenarios

1. **Redis Connection Failure**
   - Logged as error
   - Application continues without caching
   - Health check shows `connected: false`

2. **Cache Key Not Found**
   - Returns `null`
   - Application queries database directly

3. **Pattern Deletion Not Supported**
   - Falls back gracefully
   - Individual key deletion used as fallback

## Security Considerations

### Data Sensitivity

- User passwords and sensitive data are NOT cached
- Only public/non-sensitive data is cached
- Session tokens are properly managed

### Token Management

- Refresh tokens stored securely in Redis
- Access tokens blacklisted on logout
- Automatic token expiration via TTL

## Best Practices

### 1. TTL Selection

Choose appropriate TTL based on data volatility:

- **Static Data**: 1-24 hours
- **Frequently Changing**: 5-15 minutes
- **Real-time Data**: 1-5 minutes or no cache

### 2. Cache Key Design

- Use descriptive, hierarchical keys
- Include relevant parameters in keys
- Avoid special characters in keys

### 3. Cache Invalidation

- Invalidate related caches on data changes
- Use pattern matching for bulk invalidation
- Consider cache dependencies

### 4. Monitoring

- Monitor cache hit/miss ratios
- Set up alerts for cache connection issues
- Log cache performance metrics

## Troubleshooting

### Common Issues

1. **Cache Not Working**
   - Check Redis connection in health endpoint
   - Verify environment variables
   - Check Redis server logs

2. **Stale Data**
   - Verify TTL values
   - Check cache invalidation logic
   - Clear cache manually if needed

3. **Memory Issues**
   - Monitor Redis memory usage
   - Adjust TTL values if needed
   - Consider cache key cleanup

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor cache keys
redis-cli keys "taskflow:*"

# Check key TTL
redis-cli ttl "taskflow:user:123"

# Clear all cache
redis-cli flushdb
```

## Development Guidelines

### Adding New Cache Operations

1. Use existing decorators when possible
2. Follow key naming conventions
3. Add appropriate TTL values
4. Include cache invalidation for mutations
5. Update documentation

### Testing Cache Behavior

```typescript
// Test cache hit
const cached = await cacheService.get('test:key');
expect(cached).toBeDefined();

// Test cache miss
const missed = await cacheService.get('nonexistent:key');
expect(missed).toBeNull();

// Test cache invalidation
await cacheService.set('test:key', 'value');
await cacheService.deletePattern('test:*');
const afterDelete = await cacheService.get('test:key');
expect(afterDelete).toBeNull();
```

## Performance Metrics

### Cache Hit Ratio

Monitor cache effectiveness:

```
Cache Hits: 95%
Cache Misses: 5%
Average Response Time: 15ms (with cache) vs 120ms (without cache)
```

### Memory Usage

Redis memory usage should be monitored:

- Set memory limits in Redis configuration
- Monitor memory usage trends
- Implement cache key cleanup strategies

## Future Enhancements

### Potential Improvements

1. **Cache Warming**: Pre-populate frequently accessed data
2. **Cache Analytics**: Detailed hit/miss analytics
3. **Distributed Caching**: Redis cluster support
4. **Cache Compression**: Compress large cache values
5. **Smart TTL**: Dynamic TTL based on access patterns

### Monitoring Enhancements

1. **Metrics Collection**: Integrate with Prometheus/Grafana
2. **Alerting**: Set up alerts for cache issues
3. **Performance Dashboards**: Real-time cache performance monitoring

## Conclusion

Redis caching is a critical component of TaskFlow's performance optimization strategy. The implementation provides significant performance benefits while maintaining reliability through graceful degradation and comprehensive error handling. Proper monitoring and maintenance ensure the cache layer continues to deliver optimal performance.
