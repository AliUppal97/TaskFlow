# TaskFlow Database Setup Script for Windows
# This script will install and start PostgreSQL, MongoDB, and Redis

Write-Host "=== TaskFlow Database Setup ===" -ForegroundColor Green
Write-Host "This script will help you set up the required databases" -ForegroundColor Yellow
Write-Host ""

# Check if Chocolatey is installed
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue
if (-not $chocoInstalled) {
    Write-Host "Installing Chocolatey package manager..." -ForegroundColor Cyan
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    refreshenv
}

# Install PostgreSQL
Write-Host "Installing PostgreSQL..." -ForegroundColor Cyan
choco install postgresql --params '/Password:password' -y

# Install MongoDB
Write-Host "Installing MongoDB..." -ForegroundColor Cyan
choco install mongodb -y

# Install Redis
Write-Host "Installing Redis..." -ForegroundColor Cyan
choco install redis-64 -y

# Refresh environment variables
refreshenv

Write-Host ""
Write-Host "=== Database Installation Complete ===" -ForegroundColor Green
Write-Host "Now starting the databases..." -ForegroundColor Yellow
Write-Host ""

# Start PostgreSQL service
Write-Host "Starting PostgreSQL..." -ForegroundColor Cyan
Start-Service postgresql

# Start MongoDB service
Write-Host "Starting MongoDB..." -ForegroundColor Cyan
Start-Service MongoDB

# Start Redis service
Write-Host "Starting Redis..." -ForegroundColor Cyan
redis-server --service-install
Start-Service redis

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "All databases should now be running:" -ForegroundColor White
Write-Host "- PostgreSQL on port 5432" -ForegroundColor White
Write-Host "- MongoDB on port 27017" -ForegroundColor White
Write-Host "- Redis on port 6379" -ForegroundColor White
Write-Host ""
Write-Host "You can now run the backend with: cd backend && npm run start:dev" -ForegroundColor Yellow
