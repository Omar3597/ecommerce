export interface ICacheService {
  wrap<T>(key: string, ttl: number, fetchFn: () => Promise<T>): Promise<T>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  del(key: string): Promise<void>;

  /** Deletes every key that matches a glob pattern (uses SCAN). */
  invalidatePattern(pattern: string): Promise<void>;
}
