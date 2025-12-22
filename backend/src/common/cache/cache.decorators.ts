import { Logger } from '@nestjs/common';
import { CacheOptions } from './cache.types';

export function CacheResult(options: CacheOptions = {}) {
  return function (target: object, propertyName: string, descriptor: PropertyDescriptor) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const method = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    descriptor.value = async function (...args: unknown[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cacheManager = (this as { cacheManager?: { get: (key: string) => Promise<unknown>; set: (key: string, value: unknown, ttl?: number) => Promise<void> } }).cacheManager;
      if (!cacheManager) {
        logger.warn('Cache manager not found, executing method without caching');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return method.apply(this, args);
      }

      // Generate cache key from method name and arguments
      const keyPrefix = options.keyPrefix || target.constructor.name.toLowerCase();
      const key = `${keyPrefix}:${propertyName}:${JSON.stringify(args)}`;

      try {
        // Try to get from cache first
        const cachedResult = await cacheManager.get(key);
        if (cachedResult !== undefined) {
          logger.debug(`Cache hit for ${key}`);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return cachedResult;
        }

        // Execute method
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const result = await method.apply(this, args);

        // Cache result if condition is met
        if (!options.condition || options.condition(result)) {
          await cacheManager.set(key, result, options.ttl);
          logger.debug(`Cache set for ${key}, TTL: ${options.ttl || 'default'}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result;
      } catch (error: unknown) {
        logger.error(`Cache operation failed for ${key}:`, error);
        // If caching fails, execute method without cache
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
}

export function InvalidateCache(pattern: string) {
  return function (target: object, propertyName: string, descriptor: PropertyDescriptor) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const method = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    descriptor.value = async function (...args: unknown[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cacheManager = (this as { cacheManager?: { deletePattern?: (pattern: string) => Promise<void> } }).cacheManager;
      let result: unknown;

      try {
        // Execute method first
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        result = await method.apply(this, args);

        // Invalidate cache - use the cache service's deletePattern method for proper Redis support
        if (cacheManager && typeof cacheManager.deletePattern === 'function') {
          await cacheManager.deletePattern(pattern);
        } else {
          logger.warn('Cache invalidation not available - cache service may not be properly injected');
        }

        return result;
      } catch (error: unknown) {
        logger.error(`Method execution or cache invalidation failed:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

export function CacheKey(key: string) {
  return function (target: object, propertyName: string, descriptor: PropertyDescriptor) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const method = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    descriptor.value = async function (...args: unknown[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cacheManager = (this as { cacheManager?: { get: (key: string) => Promise<unknown>; set: (key: string, value: unknown) => Promise<void> } }).cacheManager;
      if (!cacheManager) {
        logger.warn('Cache manager not found, executing method without caching');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return method.apply(this, args);
      }

      try {
        // Try to get from cache first
        const cachedResult = await cacheManager.get(key);
        if (cachedResult !== undefined) {
          logger.debug(`Cache hit for ${key}`);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return cachedResult;
        }

        // Execute method
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const result = await method.apply(this, args);

        // Cache result
        await cacheManager.set(key, result);
        logger.debug(`Cache set for ${key}`);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result;
      } catch (error: unknown) {
        logger.error(`Cache operation failed for ${key}:`, error);
        // If caching fails, execute method without cache
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
}







