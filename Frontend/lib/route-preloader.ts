/**
 * 🚀 ROUTE PRELOADER SERVICE
 * Aggressively preloads all critical routes on app startup for instant navigation
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

interface RoutePreloaderConfig {
  router: AppRouterInstance
  delay?: number // Delay between prefetches (ms)
  enableLogging?: boolean
}

export class RoutePreloader {
  private router: AppRouterInstance
  private delay: number
  private enableLogging: boolean
  private prefetchedRoutes: Set<string> = new Set()

  // 📋 CRITICAL ROUTES - All main navigation routes
  private static readonly CRITICAL_ROUTES = [
    // Main Navigation
    '/',
    '/discover',
    '/liked-songs',
    '/downloads',
    '/trending',
    
    // Library Routes
    '/saved-songs',
    '/recent',
    '/playlists',
    
    // User Routes
    '/profile',
    '/settings',
    
    // Search Routes
    '/search',
    
    // Feature Routes
    '/beatmatch',
    '/beatmatch-preview',
    '/otp-preview',
    
    // Auth Routes
    '/auth/verify',
    '/auth/reset-password',
    
    // Sample Dynamic Routes (for preloading)
    '/playlists/1',
    '/artist/0OdUWJ0sBjDrqHygGUXeCF', // Sample artist
    '/album/5Z9iiGl2FcIfa3BMiv6OIw'   // Sample album
  ]

  constructor(config: RoutePreloaderConfig) {
    this.router = config.router
    this.delay = config.delay ?? 200 // Increased default delay
    this.enableLogging = config.enableLogging ?? false // Disabled by default
  }

  /**
   * Start aggressive route preloading
   */
  async startPreloading(): Promise<void> {

    // Prefetch all routes with staggered timing
    const prefetchPromises = RoutePreloader.CRITICAL_ROUTES.map((route, index) => 
      this.prefetchWithDelay(route, index)
    )

    // Wait for all prefetches to complete
    await Promise.all(prefetchPromises)
  }

  /**
   * Prefetch a single route with delay and requestIdleCallback for better performance
   */
  private async prefetchWithDelay(route: string, index: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Use requestIdleCallback if available to avoid blocking UI
        const prefetchFn = () => {
          try {
            this.router.prefetch(route)
            this.prefetchedRoutes.add(route)
          } catch (error) {
            // Silent fail
          }
          resolve()
        }

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(prefetchFn, { timeout: 1000 })
        } else {
          prefetchFn()
        }
      }, index * this.delay)
    })
  }

  /**
   * Prefetch additional routes on demand
   */
  prefetchRoute(route: string): void {
    if (!this.prefetchedRoutes.has(route)) {
      try {
        this.router.prefetch(route)
        this.prefetchedRoutes.add(route)
      } catch (error) {
        // Silent fail
      }
    }
  }

  /**
   * Check if route is prefetched
   */
  isPrefetched(route: string): boolean {
    return this.prefetchedRoutes.has(route)
  }

  /**
   * Get prefetch statistics
   */
  getStats(): { total: number; prefetched: number; percentage: number } {
    const total = RoutePreloader.CRITICAL_ROUTES.length
    const prefetched = this.prefetchedRoutes.size
    const percentage = Math.round((prefetched / total) * 100)
    
    return { total, prefetched, percentage }
  }
}

/**
 * 🎯 CONVENIENCE FUNCTION: Quick setup for route preloading
 */
export function setupRoutePreloader(router: AppRouterInstance, options?: Partial<RoutePreloaderConfig>): RoutePreloader {
  const preloader = new RoutePreloader({
    router,
    delay: options?.delay ?? 200, // Increased default delay
    enableLogging: options?.enableLogging ?? false // Disabled by default
  })
  
  // Start preloading immediately
  preloader.startPreloading()
  
  return preloader
}
