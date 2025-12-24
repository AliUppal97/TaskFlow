# TaskFlow - Start Both Servers
# PowerShell script to start both backend and frontend servers in separate windows

Write-Host "Starting TaskFlow Application..." -ForegroundColor Cyan

# Get the script directory
$scriptDir = $PSScriptRoot

# Start backend in a new window
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; .\start-backend.ps1"

# Wait a moment
Start-Sleep -Seconds 2

# Start frontend in a new window
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; .\start-frontend.ps1"

Write-Host "`nBoth servers are starting in separate windows." -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:3001/api/docs" -ForegroundColor Cyan





