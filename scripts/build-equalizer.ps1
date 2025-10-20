# PowerShell script to build native equalizer module
# Run this script from the project root directory

Write-Host "🎛️ Building Native Equalizer Module..." -ForegroundColor Cyan

# Check if Visual Studio Build Tools are installed
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $vsWhere) {
    Write-Host "✅ Visual Studio Build Tools found" -ForegroundColor Green
} else {
    Write-Host "❌ Visual Studio Build Tools not found" -ForegroundColor Red
    Write-Host "Please install Visual Studio 2019 or later with C++ tools" -ForegroundColor Red
    Write-Host "Download from: https://visualstudio.microsoft.com/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

# Check Python
$pythonVersion = python --version 2>$null
if ($pythonVersion) {
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found" -ForegroundColor Red
    exit 1
}

# Navigate to native directory
Set-Location "native"

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Clean previous build
Write-Host "`n🧹 Cleaning previous build..." -ForegroundColor Yellow
npm run clean 2>$null

# Build the module
Write-Host "`n🔨 Building native module..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Verify build
if (Test-Path "build\Release\audio_equalizer.node") {
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
    Write-Host "📦 Module located at: native\build\Release\audio_equalizer.node" -ForegroundColor Cyan
    
    # Show file size
    $fileSize = (Get-Item "build\Release\audio_equalizer.node").Length / 1KB
    Write-Host "📊 Module size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build completed but module not found" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Set-Location ".."

Write-Host "`n🎉 Native equalizer ready to use!" -ForegroundColor Green
Write-Host "`n📖 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Add EqualizerSettings component to your settings page" -ForegroundColor White
Write-Host "  2. Play a local file to test the equalizer" -ForegroundColor White
Write-Host "  3. Check the console for '🎛️ Native equalizer initialized' message" -ForegroundColor White
