const { spawn } = require('child_process')
const path = require('path')

// Set environment variables
process.env.NODE_ENV = 'development'
process.env.ELECTRON_IS_DEV = '1'

console.log('🚀 Starting 2k Music Desktop in development mode...')

// Start Next.js dev server
console.log('📦 Starting Next.js dev server...')
const nextProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '../Frontend'),
  stdio: 'inherit',
  shell: true
})

// Wait for Next.js to be ready, then start Electron
setTimeout(() => {
  console.log('⚡ Starting Electron...')
  const electronProcess = spawn('electron', ['.'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  })

  // Handle process termination
  electronProcess.on('close', () => {
    console.log('🔴 Electron closed, stopping Next.js...')
    nextProcess.kill()
    process.exit(0)
  })
}, 5000) // Wait 5 seconds for Next.js to start

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('🛑 Stopping development servers...')
  nextProcess.kill()
  process.exit(0)
})
