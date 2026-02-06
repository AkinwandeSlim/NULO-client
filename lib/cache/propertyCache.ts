/**
 * High-Performance Property Cache - IndexedDB + Memory Hybrid
 * Solves localStorage blocking issues with async storage
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  cacheKey: string;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
}

class OptimizedPropertyCache {
  private readonly DB_NAME = 'nulo_property_cache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'properties';
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly MAX_MEMORY_ENTRIES = 50; // Keep hot data in memory
  
  // In-memory cache for frequently accessed data
  private memoryCache = new Map<string, CacheEntry>();
  
  // Statistics
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0
  };
  
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to memory-only cache');
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB cache initialized');
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'cacheKey' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Generate cache key from search parameters
   */
  generateCacheKey(searchParams: any): string {
    const normalized = {
      location: (searchParams.location || '').toLowerCase().trim(),
      min_price: searchParams.min_price || 0,
      max_price: searchParams.max_price || 10000000,
      bedrooms: searchParams.bedrooms || 0,
      bathrooms: searchParams.bathrooms || 0,
      property_type: searchParams.property_type || 'all',
      sort: searchParams.sort || 'newest',
      page: searchParams.page || 1,
      limit: Math.min(searchParams.limit || 20, 50)
    };

    const paramString = JSON.stringify(normalized, Object.keys(normalized).sort());
    return this.simpleHash(paramString);
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `cache_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get cached data (checks memory first, then IndexedDB)
   */
  async get(cacheKey: string): Promise<any | null> {
    const now = Date.now();

    // Check memory cache first (fastest)
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry) {
      if (now - memoryEntry.timestamp <= memoryEntry.ttl * 1000) {
        this.stats.hits++;
        memoryEntry.accessCount++;
        memoryEntry.lastAccessed = now;
        console.log(`🎯 Memory cache HIT: ${cacheKey}`);
        return memoryEntry.data;
      } else {
        // Expired in memory
        this.memoryCache.delete(cacheKey);
      }
    }

    // Check IndexedDB (slower but persistent)
    try {
      await this.init();
      if (!this.db) {
        this.stats.misses++;
        return null;
      }

      const entry = await this.getFromIndexedDB(cacheKey);
      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (now - entry.timestamp > entry.ttl * 1000) {
        await this.deleteFromIndexedDB(cacheKey);
        this.stats.misses++;
        return null;
      }

      // Promote to memory cache if accessed frequently
      entry.accessCount++;
      entry.lastAccessed = now;
      
      if (entry.accessCount > 2 || this.memoryCache.size < this.MAX_MEMORY_ENTRIES) {
        this.memoryCache.set(cacheKey, entry);
        this.evictMemoryCacheIfNeeded();
      }

      // Update access stats in IndexedDB
      await this.updateAccessStats(cacheKey, entry.accessCount, now);

      this.stats.hits++;
      console.log(`💾 IndexedDB cache HIT: ${cacheKey}`);
      return entry.data;

    } catch (error) {
      console.warn('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cached data (writes to both memory and IndexedDB)
   */
  async set(cacheKey: string, data: any, ttl?: number, searchParams?: any): Promise<void> {
    try {
      const effectiveTtl = ttl || this.DEFAULT_TTL;
      const now = Date.now();
      
      const entry: CacheEntry = {
        data,
        timestamp: now,
        ttl: effectiveTtl,
        cacheKey,
        accessCount: 1,
        lastAccessed: now
      };

      // Always add to memory cache for fast access
      this.memoryCache.set(cacheKey, entry);
      this.evictMemoryCacheIfNeeded();

      // Persist to IndexedDB
      await this.init();
      if (this.db) {
        await this.saveToIndexedDB(entry);
      }

      this.stats.entries++;
      console.log(`💾 Cache SET: ${cacheKey} (TTL: ${effectiveTtl}s)`);
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(cacheKey: string): Promise<void> {
    try {
      this.memoryCache.delete(cacheKey);
      
      await this.init();
      if (this.db) {
        await this.deleteFromIndexedDB(cacheKey);
      }
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      
      await this.init();
      if (!this.db) return;

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.stats = { hits: 0, misses: 0, size: 0, entries: 0 };
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: string } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? ((this.stats.hits / totalRequests) * 100).toFixed(1) 
      : '0.0';

    return {
      ...this.stats,
      entries: this.memoryCache.size,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      let cleaned = 0;

      // Clean memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (now - entry.timestamp > entry.ttl * 1000) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }

      // Clean IndexedDB
      await this.init();
      if (!this.db) return;

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.openCursor();

      await new Promise<void>((resolve) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const entry: CacheEntry = cursor.value;
            if (now - entry.timestamp > entry.ttl * 1000) {
              cursor.delete();
              cleaned++;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => resolve();
      });

      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Prefetch next page for better UX
   */
  async prefetchNext(currentPage: number, searchParams: any, fetcher: (params: any) => Promise<any>): Promise<void> {
    const nextPage = currentPage + 1;
    const nextParams = { ...searchParams, page: nextPage };
    const nextCacheKey = this.generateCacheKey(nextParams);

    // Only prefetch if not already cached
    const cached = await this.get(nextCacheKey);
    if (!cached) {
      try {
        console.log(`🚀 Prefetching page ${nextPage}`);
        const data = await fetcher(nextParams);
        await this.set(nextCacheKey, data, undefined, nextParams);
      } catch (error) {
        console.warn('Prefetch failed:', error);
      }
    }
  }

  // Private helper methods

  private async getFromIndexedDB(cacheKey: string): Promise<CacheEntry | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(cacheKey);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveToIndexedDB(entry: CacheEntry): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromIndexedDB(cacheKey: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(cacheKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async updateAccessStats(cacheKey: string, accessCount: number, lastAccessed: number): Promise<void> {
    if (!this.db) return;

    try {
      const entry = await this.getFromIndexedDB(cacheKey);
      if (entry) {
        entry.accessCount = accessCount;
        entry.lastAccessed = lastAccessed;
        await this.saveToIndexedDB(entry);
      }
    } catch (error) {
      // Ignore errors in stats update
    }
  }

  private evictMemoryCacheIfNeeded(): void {
    if (this.memoryCache.size <= this.MAX_MEMORY_ENTRIES) return;

    // Evict least recently accessed entries
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = entries.slice(0, Math.floor(this.MAX_MEMORY_ENTRIES * 0.2));
    toRemove.forEach(([key]) => this.memoryCache.delete(key));
  }
}

// Create singleton instance
const optimizedPropertyCache = new OptimizedPropertyCache();

// Auto cleanup on page load and periodically
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    optimizedPropertyCache.cleanup();
  });
  
  // Cleanup every 5 minutes
  setInterval(() => {
    optimizedPropertyCache.cleanup();
  }, 5 * 60 * 1000);
}

export default optimizedPropertyCache;