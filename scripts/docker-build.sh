#!/bin/bash

# TaskFlow Docker Build Script
# This script builds Docker images for both backend and frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running or not accessible"
        exit 1
    fi
}

# Function to build backend
build_backend() {
    print_status "Building TaskFlow Backend..."

    if [ -d "backend" ]; then
        cd backend
        docker build -t taskflow-backend:latest -f Dockerfile .
        print_success "Backend built successfully"
        cd ..
    else
        print_error "Backend directory not found"
        exit 1
    fi
}

# Function to build frontend
build_frontend() {
    print_status "Building TaskFlow Frontend..."

    if [ -d "frontend" ]; then
        cd frontend
        docker build -t taskflow-frontend:latest -f Dockerfile .
        print_success "Frontend built successfully"
        cd ..
    else
        print_error "Frontend directory not found"
        exit 1
    fi
}

# Function to build production frontend with Nginx
build_frontend_prod() {
    print_status "Building TaskFlow Frontend (Production with Nginx)..."

    if [ -d "docker" ] && [ -f "docker/frontend.prod.Dockerfile" ]; then
        docker build -t taskflow-frontend:prod -f docker/frontend.prod.Dockerfile .
        print_success "Production frontend built successfully"
    else
        print_error "Production frontend Dockerfile not found"
        exit 1
    fi
}

# Function to build all services
build_all() {
    print_status "Building all TaskFlow services..."
    build_backend
    build_frontend
    print_success "All services built successfully"
}

# Function to show usage
usage() {
    echo "TaskFlow Docker Build Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -b, --backend     Build only backend service"
    echo "  -f, --frontend    Build only frontend service"
    echo "  -p, --prod        Build production frontend with Nginx"
    echo "  -a, --all         Build all services (default)"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Build all services"
    echo "  $0 --backend         # Build only backend"
    echo "  $0 --frontend        # Build only frontend"
    echo "  $0 --prod           # Build production frontend"
}

# Main script
main() {
    print_status "TaskFlow Docker Build Script Starting..."

    # Check if Docker is available
    check_docker

    # Parse command line arguments
    case "${1:-all}" in
        -b|--backend)
            build_backend
            ;;
        -f|--frontend)
            build_frontend
            ;;
        -p|--prod)
            build_frontend_prod
            ;;
        -a|--all|all)
            build_all
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Invalid option: $1"
            usage
            exit 1
            ;;
    esac

    print_success "Docker build completed successfully!"
}

# Run main function
main "$@"
