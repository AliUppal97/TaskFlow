import type { Cache } from 'cache-manager';
import type { CacheOptions, CacheInvalidationOptions, CacheMethodParams } from '../types/cache.types';

/**
 * Redis Store interface for cache-manager-ioredis
 * Defines the methods available on the Redis store instance
 */
export interface RedisStore {
  /**
   * Get all keys matching a pattern
   * @param pattern - Redis pattern (supports * wildcard)
   * @returns Array of matching keys
   */
  keys(pattern: string): Promise<string[]>;

  /**
   * Reset/clear the entire cache store
   */
  reset(): Promise<void>;

  /**
   * Redis client instance (ioredis)
   */
  client?: {
    /**
     * Get Redis server information
     */
    info(): Promise<string>;
  };
}

/**
 * Extended Cache interface that includes Redis store access
 */
export interface CacheWithStore extends Cache {
  /**
   * Redis store instance with additional methods
   */
  store?: RedisStore;
}

/**
 * Cache operation result types
 */
export interface CacheOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  ttl: number;
  keyPrefix: string;
  maxItems?: number;
  enableStats?: boolean;
}

// Re-export types from the common types
export type { CacheOptions, CacheInvalidationOptions, CacheMethodParams };
