/**
 * Local browser cache for artist detail data
 * Stores artist data in localStorage with TTL
 */

interface CachedArtistData {
  biography: any;
  images: string[];
  albums: any[];
  topArtists: any[];
  timestamp: number;
}

const CACHE_PREFIX = '2kmusic_artist_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export class ArtistCache {
  /**
   * Get cached artist data
   */
  static get(artistId: string): CachedArtistData | null {
    try {
      const key = `${CACHE_PREFIX}${artistId}`;
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data: CachedArtistData = JSON.parse(cached);
      
      // Check if cache is still valid
      const now = Date.now();
      if (now - data.timestamp > CACHE_TTL) {
        // Cache expired, remove it
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Store artist data in cache
   */
  static set(artistId: string, data: Omit<CachedArtistData, 'timestamp'>): void {
    try {
      const key = `${CACHE_PREFIX}${artistId}`;
      const cachedData: CachedArtistData = {
        ...data,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(key, JSON.stringify(cachedData));
    } catch (error) {
      // If localStorage is full, clear old entries
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldEntries();
        // Try again
        try {
          const key = `${CACHE_PREFIX}${artistId}`;
          const cachedData: CachedArtistData = {
            ...data,
            timestamp: Date.now(),
          };
          localStorage.setItem(key, JSON.stringify(cachedData));
        } catch (retryError) {
          // Silent fail
        }
      }
    }
  }

  /**
   * Clear a specific artist's cache
   */
  static clear(artistId: string): void {
    try {
      const key = `${CACHE_PREFIX}${artistId}`;
      localStorage.removeItem(key);
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Clear all expired cache entries
   */
  static clearExpired(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      // Find all artist cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data: CachedArtistData = JSON.parse(cached);
            if (now - data.timestamp > CACHE_TTL) {
              keysToRemove.push(key);
            }
          }
        }
      }

      // Remove expired entries
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Clear old entries to make space (removes oldest 50%)
   */
  private static clearOldEntries(): void {
    try {
      const entries: { key: string; timestamp: number }[] = [];

      // Collect all artist cache entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data: CachedArtistData = JSON.parse(cached);
            entries.push({ key, timestamp: data.timestamp });
          }
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 50%
      const toRemove = Math.ceil(entries.length / 2);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): { count: number; totalSize: number } {
    try {
      let count = 0;
      let totalSize = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          count++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      return { count, totalSize };
    } catch (error) {
      return { count: 0, totalSize: 0 };
    }
  }
}

// Clear expired entries on load
if (typeof window !== 'undefined') {
  ArtistCache.clearExpired();
}
