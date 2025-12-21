import { Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  condition?: (result: any) => boolean;
}

export function CacheResult(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    descriptor.value = async function (...args: any[]) {
      const cacheManager = (this as any).cacheManager;
      if (!cacheManager) {
        logger.warn('Cache manager not found, executing method without caching');
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
          return cachedResult;
        }

        // Execute method
        const result = await method.apply(this, args);

        // Cache result if condition is met
        if (!options.condition || options.condition(result)) {
          await cacheManager.set(key, result, options.ttl);
          logger.debug(`Cache set for ${key}, TTL: ${options.ttl || 'default'}`);
        }

        return result;
      } catch (error) {
        logger.error(`Cache operation failed for ${key}:`, error);
        // If caching fails, execute method without cache
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
}

export function InvalidateCache(pattern: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    descriptor.value = async function (...args: any[]) {
      const cacheManager = (this as any).cacheManager;
      let result;

      try {
        // Execute method first
        result = await method.apply(this, args);

        // Invalidate cache
        if (cacheManager) {
          const keys = await cacheManager.store.keys(pattern);
          if (keys.length > 0) {
            await Promise.all(keys.map(key => cacheManager.del(key)));
            logger.debug(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
          }
        }

        return result;
      } catch (error) {
        logger.error(`Method execution or cache invalidation failed:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

export function CacheKey(key: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    descriptor.value = async function (...args: any[]) {
      const cacheManager = (this as any).cacheManager;
      if (!cacheManager) {
        logger.warn('Cache manager not found, executing method without caching');
        return method.apply(this, args);
      }

      try {
        // Try to get from cache first
        const cachedResult = await cacheManager.get(key);
        if (cachedResult !== undefined) {
          logger.debug(`Cache hit for ${key}`);
          return cachedResult;
        }

        // Execute method
        const result = await method.apply(this, args);

        // Cache result
        await cacheManager.set(key, result);
        logger.debug(`Cache set for ${key}`);

        return result;
      } catch (error) {
        logger.error(`Cache operation failed for ${key}:`, error);
        // If caching fails, execute method without cache
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
}



