import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { CacheWithStore } from './cache.types';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
}

/**
 * Cache Service - Abstraction layer for Redis caching
 *
 * Responsibilities:
 * - Get/set/delete cache entries
 * - Pattern-based cache invalidation
 * - Cache key generation with prefixes
 * - Error handling (cache failures don't break application)
 *
 * Design decisions:
 * - Errors are logged but don't throw (graceful degradation)
 * - Pattern deletion uses Redis-specific features (fallback if unavailable)
 * - Debug logging for cache operations (useful for performance tuning)
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: CacheWithStore,
  ) {}

  /**
   * Get value from cache
   *
   * @param key - Cache key
   * @returns Cached value or null if not found/error
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
      }
      return value || null;
    } catch (error: unknown) {
      // Cache errors don't break the application (graceful degradation)
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting cache key ${key}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - TTL and other options
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      await this.cacheManager.set(key, value, options?.ttl);
      this.logger.debug(
        `Cache set for key: ${key}, TTL: ${options?.ttl || 'default'}`,
      );
    } catch (error: unknown) {
      // Cache errors don't break the application
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error setting cache key ${key}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  /**
   * Delete a single cache entry
   *
   * @param key - Cache key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error deleting cache key ${key}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  /**
   * Delete all cache keys matching a pattern
   * 
   * Use case: Invalidate all task-related cache when a task is updated
   * Example: deletePattern('task:*') removes all task caches
   * 
   * Note: Pattern deletion is Redis-specific, falls back gracefully if unavailable
   * 
   * @param pattern - Redis key pattern (supports * wildcard)
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      // Access Redis store directly for pattern matching (cache-manager limitation)
      // Note: Pattern deletion may not be available in all cache stores
      const store = this.cacheManager.store;
      if (store && typeof store.keys === 'function') {
        const keys = await store.keys(pattern);
        if (keys && keys.length > 0) {
          // Delete all matching keys in parallel
          await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
          this.logger.debug(`Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
        }
        } else {
          this.logger.warn('Pattern deletion not supported by this cache store');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error deleting cache pattern ${pattern}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      }
  }

  async clear(): Promise<void> {
    try {
      // cache-manager v7 uses reset() method
      if (this.cacheManager.store && typeof this.cacheManager.store.reset === 'function') {
        await this.cacheManager.store.reset();
      } else {
        // Fallback: try to clear all keys if reset is not available
        this.logger.warn('Cache reset not available, skipping');
      }
      this.logger.debug('Cache cleared');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error clearing cache: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  /**
   * Generate cache key with consistent prefix format
   *
   * Format: prefix:part1:part2:part3
   * Example: generateKey('user', '123') => 'user:123'
   *
   * @param prefix - Key prefix (e.g., 'user', 'task')
   * @param parts - Additional key parts
   * @returns Formatted cache key
   */
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Check if Redis is healthy and responding
   *
   * @returns Promise<boolean> - true if Redis is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Try to set and get a test key
      const testKey = this.generateKey('health', 'check');
      const testValue = `health-check-${Date.now()}`;

      await this.set(testKey, testValue, { ttl: 10 }); // 10 second TTL
      const retrieved = await this.get(testKey);

      return retrieved === testValue;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Redis health check failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      return false;
    }
  }

  /**
   * Get cache statistics and health information
   *
   * @returns Basic cache health and connection status
   */
  async getStats(): Promise<{
    connected: boolean;
    storeType: string;
  }> {
    try {
      const isHealthy = await this.isHealthy();
      const storeType = this.cacheManager.store ? this.cacheManager.store.constructor.name : 'unknown';

      return {
        connected: isHealthy,
        storeType,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting cache stats: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      return { connected: false, storeType: 'unknown' };
    }
  }

  /**
   * Cache key constants - centralized key naming
   * Prevents typos and ensures consistency across the application
   */
  static readonly KEYS = {
    USER: 'user',
    TASK: 'task',
    TASKS_LIST: 'tasks:list',
    TASK_STATS: 'task:stats',
    REFRESH_TOKEN: 'refresh_token',
    BLACKLIST: 'blacklist',
  } as const;
}



