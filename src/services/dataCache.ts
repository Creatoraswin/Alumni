import { Student } from './apiService';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY = 'alumni_data_cache_v2';
const CACHE_TIMESTAMP_KEY = 'alumni_data_cache_timestamp_v2';

interface CacheData {
  students: Student[];
  timestamp: number;
}

class DataCacheService {
  private memoryCache: CacheData | null = null;
  private loadingPromise: Promise<Student[]> | null = null;

  constructor() {
    // Initialize from localStorage on creation
    this.loadFromStorage();
  }

  /**
   * Load cache data from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const students = JSON.parse(cachedData) as Student[];
        
        if (this.isValidCache(timestamp)) {
          this.memoryCache = { students, timestamp };
        } else {
          this.clearStorage();
        }
      }
    } catch (error) {
      this.clearStorage();
    }
  }

  /**
   * Save cache data to localStorage
   */
  private saveToStorage(data: CacheData): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.students));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, data.timestamp.toString());
    } catch (error) {
      // If localStorage is full, clear it and try again
      this.clearStorage();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data.students));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, data.timestamp.toString());
      } catch (retryError) {
        // Failed to save cache even after clearing
      }
    }
  }

  /**
   * Clear cache from localStorage
   */
  private clearStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      // Error clearing cache storage
    }
  }

  /**
   * Check if cache timestamp is still valid
   */
  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
  }

  /**
   * Get cached data if available and valid
   */
  getCachedData(): Student[] | null {
    if (this.memoryCache && this.isValidCache(this.memoryCache.timestamp)) {
      return this.memoryCache.students;
    }
    
    return null;
  }

  /**
   * Check if we have valid cached data
   */
  hasValidCache(): boolean {
    return this.getCachedData() !== null;
  }

  /**
   * Cache new data
   */
  cacheData(students: Student[]): void {
    const cacheData: CacheData = {
      students: students,
      timestamp: Date.now()
    };
    
    this.memoryCache = cacheData;
    this.saveToStorage(cacheData);
  }

  /**
   * Get data with caching logic - returns cached data or fetches new data
   */
  async getData(fetchFunction: () => Promise<Student[]>, forceRefresh: boolean = false): Promise<Student[]> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.hasValidCache()) {
      return this.getCachedData()!;
    }

    // If already loading, return the existing promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start new fetch
    this.loadingPromise = fetchFunction()
      .then((students) => {
        this.cacheData(students);
        this.loadingPromise = null;
        return students;
      })
      .catch((error) => {
        this.loadingPromise = null;
        
        // Return cached data if available, even if expired, as fallback
        const cachedData = this.memoryCache?.students;
        if (cachedData) {
          return cachedData;
        }
        
        throw error;
      });

    return this.loadingPromise;
  }

  /**
   * Clear all cache data
   */
  clearCache(): void {
    this.memoryCache = null;
    this.clearStorage();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    hasCache: boolean;
    cacheAge: number;
    cacheSize: number;
    isExpired: boolean;
  } {
    if (!this.memoryCache) {
      return {
        hasCache: false,
        cacheAge: 0,
        cacheSize: 0,
        isExpired: true
      };
    }

    const age = Date.now() - this.memoryCache.timestamp;
    return {
      hasCache: true,
      cacheAge: age,
      cacheSize: this.memoryCache.students.length,
      isExpired: !this.isValidCache(this.memoryCache.timestamp)
    };
  }
  
  /**
   * Preload data in the background to improve perceived performance
   */
  preloadData(fetchFunction: () => Promise<Student[]>): void {
    // Only preload if we don't have valid cache
    if (!this.hasValidCache()) {
      fetchFunction()
        .then((students) => {
          this.cacheData(students);
        })
        .catch((error) => {
          console.warn('Preloading failed:', error);
        });
    }
  }
}

// Export singleton instance
export const dataCache = new DataCacheService();