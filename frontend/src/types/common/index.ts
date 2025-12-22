/**
 * Common utility types
 */

/**
 * Makes all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes specific keys of T optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specific keys of T required
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Extracts the type of array elements
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Creates a type with all properties of T set to readonly
 */
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P];
};





