import { Logger } from '@nestjs/common';
import { CacheOptions } from './cache.types';

export function CacheResult(options: CacheOptions = {}) {
  return function (target: object, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    if (typeof method !== 'function') {
      throw new Error(`CacheResult decorator can only be applied to methods`);
    }
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      const cacheManager = (this as { cacheManager?: { get: (key: string) => Promise<unknown>; set: (key: string, value: unknown, ttl?: number) => Promise<void> } }).cacheManager;
      if (!cacheManager) {
        logger.warn('Cache manager not found, executing method without caching');
        return (method as (...args: unknown[]) => Promise<unknown>).apply(this, args);
      }

      // Generate cache key from method name and arguments
      const keyPrefix = options.keyPrefix || target.constructor.name.toLowerCase();
      const key = `${keyPrefix}:${propertyName}:${JSON.stringify(args)}`;

      try {
        // Try to get from cache first
        const cachedResult = await cacheManager.get(key);
        if (cachedResult !== undefined) {
          logger.debug(`Cache hit for ${key}`);
          return cachedResult;
        }

        // Execute method
        const result = await (method as (...args: unknown[]) => Promise<unknown>).apply(this, args);

        // Cache result if condition is met
        if (!options.condition || options.condition(result)) {
          await cacheManager.set(key, result, options.ttl);
          logger.debug(`Cache set for ${key}, TTL: ${options.ttl || 'default'}`);
        }

        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Cache operation failed for ${key}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
        // If caching fails, execute method without cache
        return (method as (...args: unknown[]) => Promise<unknown>).apply(this, args);
      }
    };

    return descriptor;
  };
}

export function InvalidateCache(pattern: string) {
  return function (target: object, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    if (typeof method !== 'function') {
      throw new Error(`InvalidateCache decorator can only be applied to methods`);
    }
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      const cacheManager = (this as { cacheManager?: { deletePattern?: (pattern: string) => Promise<void> } }).cacheManager;
      let result: unknown;

      try {
        // Execute method first
        result = await (method as (...args: unknown[]) => Promise<unknown>).apply(this, args);

        // Invalidate cache - use the cache service's deletePattern method for proper Redis support
        if (cacheManager && typeof cacheManager.deletePattern === 'function') {
          await cacheManager.deletePattern(pattern);
        } else {
          logger.warn('Cache invalidation not available - cache service may not be properly injected');
        }

        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Method execution or cache invalidation failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
        throw error;
      }
    };

    return descriptor;
  };
}

export function CacheKey(key: string) {
  return function (target: object, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    if (typeof method !== 'function') {
      throw new Error(`CacheKey decorator can only be applied to methods`);
    }
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      const cacheManager = (this as { cacheManager?: { get: (key: string) => Promise<unknown>; set: (key: string, value: unknown) => Promise<void> } }).cacheManager;
      if (!cacheManager) {
        logger.warn('Cache manager not found, executing method without caching');
        return (method as (...args: unknown[]) => Promise<unknown>).apply(this, args);
      }

      try {
        // Try to get from cache first
        const cachedResult = await cacheManager.get(key);
        if (cachedResult !== undefined) {
          logger.debug(`Cache hit for ${key}`);
          return cachedResult;
        }

        // Execute method
        const result = await (method as (...args: unknown[]) => Promise<unknown>).apply(this, args);

        // Cache result
        await cacheManager.set(key, result);
        logger.debug(`Cache set for ${key}`);

        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Cache operation failed for ${key}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
        // If caching fails, execute method without cache
        return (method as (...args: unknown[]) => Promise<unknown>).apply(this, args);
      }
    };

    return descriptor;
  };
}



