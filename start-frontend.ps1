# TaskFlow - Start Frontend Server
# PowerShell script to start the Next.js frontend server

Write-Host "Starting TaskFlow Frontend..." -ForegroundColor Cyan

# Navigate to frontend directory
Set-Location -Path "$PSScriptRoot\frontend"

# Check if node_modules exists, if not install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the development server
Write-Host "Starting frontend server on http://localhost:3000" -ForegroundColor Green
npm run dev



