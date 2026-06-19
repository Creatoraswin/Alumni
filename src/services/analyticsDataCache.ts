import { StudentStrength, fetchStudentStrengthData, fetchStudentsData } from './apiService';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const STUDENT_STRENGTH_CACHE_KEY = 'student_strength_data_cache_v2';
const ALUMNI_FORM_CACHE_KEY = 'alumni_form_data_cache_v2';
const CACHE_TIMESTAMP_KEY = 'analytics_data_cache_timestamp_v2';

interface AnalyticsCacheData {
  studentStrength: StudentStrength[];
  alumniForm: any[];
  timestamp: number;
}

class AnalyticsDataCacheService {
  private memoryCache: AnalyticsCacheData | null = null;
  private loadingPromise: Promise<{ studentStrength: StudentStrength[]; alumniForm: any[] }> | null = null;

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
      const cachedStudentStrength = localStorage.getItem(STUDENT_STRENGTH_CACHE_KEY);
      const cachedAlumniForm = localStorage.getItem(ALUMNI_FORM_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedStudentStrength && cachedAlumniForm && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const studentStrength = JSON.parse(cachedStudentStrength) as StudentStrength[];
        const alumniForm = JSON.parse(cachedAlumniForm) as any[];
        
        if (this.isValidCache(timestamp)) {
          this.memoryCache = { studentStrength, alumniForm, timestamp };
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
  private saveToStorage(data: AnalyticsCacheData): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STUDENT_STRENGTH_CACHE_KEY, JSON.stringify(data.studentStrength));
      localStorage.setItem(ALUMNI_FORM_CACHE_KEY, JSON.stringify(data.alumniForm));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, data.timestamp.toString());
    } catch (error) {
      // If localStorage is full, clear it and try again
      this.clearStorage();
      try {
        localStorage.setItem(STUDENT_STRENGTH_CACHE_KEY, JSON.stringify(data.studentStrength));
        localStorage.setItem(ALUMNI_FORM_CACHE_KEY, JSON.stringify(data.alumniForm));
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
      localStorage.removeItem(STUDENT_STRENGTH_CACHE_KEY);
      localStorage.removeItem(ALUMNI_FORM_CACHE_KEY);
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
  getCachedData(): { studentStrength: StudentStrength[]; alumniForm: any[] } | null {
    if (this.memoryCache && this.isValidCache(this.memoryCache.timestamp)) {
      return {
        studentStrength: this.memoryCache.studentStrength,
        alumniForm: this.memoryCache.alumniForm
      };
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
  cacheData(studentStrength: StudentStrength[], alumniForm: any[]): void {
    const cacheData: AnalyticsCacheData = {
      studentStrength: studentStrength,
      alumniForm: alumniForm,
      timestamp: Date.now()
    };
    
    this.memoryCache = cacheData;
    this.saveToStorage(cacheData);
  }

  /**
   * Get data with caching logic - returns cached data or fetches new data
   */
  async getData(forceRefresh: boolean = false): Promise<{ studentStrength: StudentStrength[]; alumniForm: any[] }> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.hasValidCache()) {
      const cached = this.getCachedData();
      if (cached) {
        console.log('Returning cached analytics data');
        return cached;
      }
    }

    // If already loading, return the existing promise
    if (this.loadingPromise) {
      console.log('Analytics data already loading, returning existing promise');
      return this.loadingPromise;
    }

    // Start new fetch
    console.log('Fetching fresh analytics data');
    this.loadingPromise = Promise.all([
      fetchStudentStrengthData(),
      fetchStudentsData(true) // true to get all data including unapproved
    ])
      .then(([studentStrength, alumniForm]) => {
        this.cacheData(studentStrength, alumniForm);
        this.loadingPromise = null;
        console.log('Analytics data fetched and cached successfully');
        return { studentStrength, alumniForm };
      })
      .catch((error) => {
        this.loadingPromise = null;
        
        // Return cached data if available, even if expired, as fallback
        const cachedData = this.memoryCache;
        if (cachedData) {
          console.log('Returning expired cached data due to fetch error');
          return {
            studentStrength: cachedData.studentStrength,
            alumniForm: cachedData.alumniForm
          };
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
    studentStrengthSize: number;
    alumniFormSize: number;
    isExpired: boolean;
  } {
    if (!this.memoryCache) {
      return {
        hasCache: false,
        cacheAge: 0,
        studentStrengthSize: 0,
        alumniFormSize: 0,
        isExpired: true
      };
    }

    const age = Date.now() - this.memoryCache.timestamp;
    return {
      hasCache: true,
      cacheAge: age,
      studentStrengthSize: this.memoryCache.studentStrength.length,
      alumniFormSize: this.memoryCache.alumniForm.length,
      isExpired: !this.isValidCache(this.memoryCache.timestamp)
    };
  }
  
  /**
   * Preload data in the background to improve perceived performance
   */
  preloadData(): void {
    // Only preload if we don't have valid cache
    if (!this.hasValidCache()) {
      this.getData().catch((error) => {
        console.warn('Analytics data preloading failed:', error);
      });
    }
  }
  
  /**
   * Force refresh the cache with fresh data
   */
  async refreshCache(): Promise<{ studentStrength: StudentStrength[]; alumniForm: any[] }> {
    console.log('Force refreshing analytics data cache');
    return this.getData(true);
  }
}

// Export singleton instance
export const analyticsDataCache = new AnalyticsDataCacheService();