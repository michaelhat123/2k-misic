#!/usr/bin/env ts-node

const BASE = "http://localhost:3000";

// All your app routes that need warming up
const routes = [
  // Main navigation
  "/",                    // Home page
  "/discover",            // Discover page
  "/liked-songs",         // Liked Songs
  "/downloads",           // Downloads page
  "/trending",            // Trending page
  
  // Library items
  "/saved-songs",         // Your Library / Saved Songs
  "/recent",              // Recently played
  "/playlists",           // Playlists overview
  
  // Search & Profile
  "/search",              // Search page
  "/profile",             // Profile page
  "/settings",            // Settings page
  
  // Features
  "/beatmatch",           // Beatmatch feature
  "/beatmatch-preview",   // Beatmatch preview
  "/otp-preview",         // OTP preview
  
  // Sample dynamic routes
  "/playlists/1",         // Sample numeric playlist ID
  "/playlists/sample-id", // Sample playlist ID
  "/artist/0OdUWJ0sBjDrqHygGUXeCF", // Sample artist (Band of Horses)
  "/album/5Z9iiGl2FcIfa3BMiv6OIw",  // Sample album
  
  // Auth routes (will redirect if already authenticated)
  "/auth/verify",         // Email verification
  "/auth/reset-password", // Password reset
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function warmupRoute(path: string): Promise<void> {
  try {
    const response = await fetch(BASE + path, { 
      redirect: "manual",
      headers: {
        'User-Agent': 'NextJS-Warmup-Script'
      }
    });
    
    const status = response.status;
    const statusText = status < 400 ? '✅' : '❌';
  } catch (error) {
    // Silent fail
  }
}

async function warmupAll(): Promise<void> {
  // Small delay to ensure dev server is fully ready
  await sleep(3000);

  // Warm up routes with small delays to avoid overwhelming the server
  for (const route of routes) {
    await warmupRoute(route);
    // Small delay between requests to be gentle on the dev server
    await sleep(200);
  }

  // Keep the process alive so concurrently doesn't kill the dev server
  setInterval(() => {
    // Do nothing, just keep alive
  }, 60000); // Check every minute
}

// Run the warmup
warmupAll().catch(error => {
  process.exit(1);
});
