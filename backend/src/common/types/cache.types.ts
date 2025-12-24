/**
 * Cache decorator options
 */
export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  condition?: (result: unknown) => boolean;
}

/**
 * Cache invalidation options
 */
export interface CacheInvalidationOptions {
  pattern?: string;
  key?: string;
  keys?: string[];
}

/**
 * Method parameter for cache decorators
 */
export interface CacheMethodParams {
  target: unknown;
  propertyName: string;
  descriptor: PropertyDescriptor;
  args: unknown[];
}


