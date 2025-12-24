# TaskFlow - Start Backend Server
# PowerShell script to start the NestJS backend server

Write-Host "Starting TaskFlow Backend..." -ForegroundColor Cyan

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Check if node_modules exists, if not install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.template" ".env"
    Write-Host "Please configure your .env file with database credentials!" -ForegroundColor Yellow
}

# Start the development server
Write-Host "Starting backend server on http://localhost:3001" -ForegroundColor Green
npm run start:dev





