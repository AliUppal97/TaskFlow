# TaskFlow Docker Quick Start Script for Windows
# This script provides a simple way to start TaskFlow with Docker

param(
    [string]$Environment = "dev",
    [switch]$Build,
    [switch]$Clean,
    [switch]$Help
)

# Colors for output
$BLUE = "Blue"
$GREEN = "Green"
$YELLOW = "Yellow"
$RED = "Red"
$WHITE = "White"

function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Color = $WHITE
    )
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor $Color
}

function Write-Status {
    param([string]$Message)
    Write-ColoredOutput "INFO: $Message" $BLUE
}

function Write-Success {
    param([string]$Message)
    Write-ColoredOutput "SUCCESS: $Message" $GREEN
}

function Write-Warning {
    param([string]$Message)
    Write-ColoredOutput "WARNING: $Message" $YELLOW
}

function Write-Error {
    param([string]$Message)
    Write-ColoredOutput "ERROR: $Message" $RED
}

function Show-Help {
    Write-Host "TaskFlow Docker Quick Start Script" -ForegroundColor $WHITE
    Write-Host ""
    Write-Host "Usage: .\docker-quickstart.ps1 [OPTIONS]" -ForegroundColor $WHITE
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $WHITE
    Write-Host "  -Environment <env>   Environment to deploy (dev/prod) [default: dev]" -ForegroundColor $WHITE
    Write-Host "  -Build               Build images before deployment" -ForegroundColor $WHITE
    Write-Host "  -Clean               Clean up before deployment" -ForegroundColor $WHITE
    Write-Host "  -Help                Show this help message" -ForegroundColor $WHITE
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $WHITE
    Write-Host "  .\docker-quickstart.ps1" -ForegroundColor $WHITE
    Write-Host "  .\docker-quickstart.ps1 -Environment prod -Build" -ForegroundColor $WHITE
    Write-Host "  .\docker-quickstart.ps1 -Clean" -ForegroundColor $WHITE
}

function Test-Docker {
    try {
        $null = docker info 2>$null
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerCompose {
    try {
        $null = docker-compose version 2>$null
        return $true
    }
    catch {
        return $false
    }
}

function Invoke-Cleanup {
    Write-Status "Cleaning up Docker resources..."

    try {
        docker-compose down -v --remove-orphans 2>$null
        docker system prune -f 2>$null
        Write-Success "Cleanup completed"
    }
    catch {
        Write-Warning "Cleanup encountered some issues, but continuing..."
    }
}

function Invoke-Build {
    Write-Status "Building Docker images..."

    try {
        # Build backend
        Push-Location backend
        docker build -t taskflow-backend:latest .
        Pop-Location

        # Build frontend
        Push-Location frontend
        docker build -t taskflow-frontend:latest .
        Pop-Location

        Write-Success "Images built successfully"
    }
    catch {
        Write-Error "Failed to build images: $_"
        exit 1
    }
}

function Start-Development {
    Write-Status "Starting TaskFlow Development Environment..."

    if (!(Test-Path "docker-compose.dev.yml")) {
        Write-Error "docker-compose.dev.yml not found"
        exit 1
    }

    try {
        docker-compose -f docker-compose.dev.yml up -d
        Write-Success "Development environment started"

        Write-Status "Waiting for services to be healthy..."
        Start-Sleep -Seconds 10

        Write-Host ""
        Write-ColoredOutput "TaskFlow Development Environment is running!" $GREEN
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor $WHITE
        Write-Host "Backend API: http://localhost:3001" -ForegroundColor $WHITE
        Write-Host "API Docs: http://localhost:3001/api/docs" -ForegroundColor $WHITE
        Write-Host ""
        Write-Host "To view logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor $WHITE
        Write-Host "To stop: docker-compose -f docker-compose.dev.yml down" -ForegroundColor $WHITE
    }
    catch {
        Write-Error "Failed to start development environment: $_"
        exit 1
    }
}

function Start-Production {
    Write-Status "Starting TaskFlow Production Environment..."

    if (!(Test-Path "docker/docker-compose.prod.yml")) {
        Write-Error "docker/docker-compose.prod.yml not found"
        exit 1
    }

    $envFile = "docker/.env.prod"
    if (!(Test-Path $envFile)) {
        Write-Warning "Environment file $envFile not found. Creating from template..."
        if (Test-Path "docker/env.prod.template") {
            Copy-Item "docker/env.prod.template" $envFile
            Write-Warning "Please edit $envFile with your production settings before running again"
            exit 1
        } else {
            Write-Error "Environment template not found"
            exit 1
        }
    }

    try {
        docker-compose -f docker/docker-compose.prod.yml --env-file $envFile up -d
        Write-Success "Production environment started"

        Write-Status "Waiting for services to be healthy..."
        Start-Sleep -Seconds 15

        Write-Host ""
        Write-ColoredOutput "TaskFlow Production Environment is running!" $GREEN
        Write-Host "Make sure to configure your domain and SSL certificates" -ForegroundColor $WHITE
        Write-Host "To check status: docker-compose -f docker/docker-compose.prod.yml ps" -ForegroundColor $WHITE
        Write-Host "To view logs: docker-compose -f docker/docker-compose.prod.yml logs -f" -ForegroundColor $WHITE
        Write-Host "To stop: docker-compose -f docker/docker-compose.prod.yml down" -ForegroundColor $WHITE
    }
    catch {
        Write-Error "Failed to start production environment: $_"
        exit 1
    }
}

# Main script logic
if ($Help) {
    Show-Help
    exit 0
}

Write-ColoredOutput "TaskFlow Docker Quick Start" $BLUE

# Check prerequisites
if (!(Test-Docker)) {
    Write-Error "Docker is not running or not accessible. Please start Docker Desktop."
    exit 1
}

if (!(Test-DockerCompose)) {
    Write-Error "Docker Compose is not available. Please install Docker Desktop."
    exit 1
}

# Clean up if requested
if ($Clean) {
    Invoke-Cleanup
}

# Build images if requested
if ($Build) {
    Invoke-Build
}

# Start environment
switch ($Environment.ToLower()) {
    "dev" {
        Start-Development
    }
    "prod" {
        Start-Production
    }
    default {
        Write-Error "Invalid environment: $Environment. Use 'dev' or 'prod'"
        exit 1
    }
}

