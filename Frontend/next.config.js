/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production builds
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    }
  }),
  
  // Development mode settings
  ...(process.env.NODE_ENV === 'development' && {
    images: {
      domains: [
        'lh3.googleusercontent.com',
        'i.scdn.co', // Spotify images
        'lastfm.freetls.fastly.net', // Last.fm images
        'localhost'
      ]
    }
  }),
  
  // Webpack configuration for Electron
  webpack: (config, { isServer }) => {
    // Only apply Electron-specific config in production
    if (process.env.NODE_ENV === 'production' && !isServer) {
      config.target = 'electron-renderer'
    }
    
    return config
  },

  // Turbopack configuration (experimental)
  experimental: {
    turbo: {
      rules: {
        // Add any custom rules if needed
      },
      resolveAlias: {
        // Add any aliases if needed
      }
    }
  },
  
  // Environment variables
  env: {
    ELECTRON_ENV: process.env.NODE_ENV
  }
}

module.exports = nextConfig
