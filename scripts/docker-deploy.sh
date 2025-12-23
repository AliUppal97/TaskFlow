#!/bin/bash

# TaskFlow Docker Deployment Script
# This script provides various deployment options for TaskFlow

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

# Function to check if docker-compose is available
check_compose() {
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "docker-compose is not installed"
        exit 1
    fi
}

# Function to deploy development environment
deploy_dev() {
    print_status "Deploying TaskFlow Development Environment..."

    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml up -d --build
        print_success "Development environment deployed"
        show_status
    else
        print_error "docker-compose.dev.yml not found"
        exit 1
    fi
}

# Function to deploy production environment
deploy_prod() {
    print_status "Deploying TaskFlow Production Environment..."

    if [ -f "docker/docker-compose.prod.yml" ]; then
        local env_file="${1:-docker/.env.prod}"
        if [ ! -f "$env_file" ]; then
            print_warning "Environment file $env_file not found. Using defaults."
            docker-compose -f docker/docker-compose.prod.yml up -d --build
        else
            docker-compose -f docker/docker-compose.prod.yml --env-file "$env_file" up -d --build
        fi
        print_success "Production environment deployed"
        show_status
    else
        print_error "docker/docker-compose.prod.yml not found"
        exit 1
    fi
}

# Function to deploy with nginx proxy
deploy_with_proxy() {
    print_status "Deploying TaskFlow with Nginx Proxy..."

    if [ -f "docker/docker-compose.prod.yml" ]; then
        local env_file="${1:-docker/.env.prod}"
        if [ ! -f "$env_file" ]; then
            print_warning "Environment file $env_file not found. Using defaults."
            docker-compose -f docker/docker-compose.prod.yml --profile proxy up -d --build
        else
            docker-compose -f docker/docker-compose.prod.yml --env-file "$env_file" --profile proxy up -d --build
        fi
        print_success "Environment with proxy deployed"
        show_status
    else
        print_error "docker/docker-compose.prod.yml not found"
        exit 1
    fi
}

# Function to stop all services
stop_all() {
    print_status "Stopping all TaskFlow services..."

    # Try different compose files
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml down
    fi

    if [ -f "docker-compose.yml" ]; then
        docker-compose down
    fi

    if [ -f "docker/docker-compose.prod.yml" ]; then
        docker-compose -f docker/docker-compose.prod.yml down
    fi

    print_success "All services stopped"
}

# Function to show status of services
show_status() {
    print_status "Service Status:"
    docker-compose ps 2>/dev/null || docker-compose -f docker-compose.dev.yml ps 2>/dev/null || docker-compose -f docker/docker-compose.prod.yml ps 2>/dev/null || print_warning "No running services found"
}

# Function to show logs
show_logs() {
    local service="${1:-all}"
    local follow="${2:-}"

    if [ "$service" = "all" ]; then
        print_status "Showing logs for all services..."
        if [ -n "$follow" ]; then
            docker-compose logs -f
        else
            docker-compose logs
        fi
    else
        print_status "Showing logs for $service..."
        if [ -n "$follow" ]; then
            docker-compose logs -f "$service"
        else
            docker-compose logs "$service"
        fi
    fi
}

# Function to restart services
restart_service() {
    local service="$1"
    if [ -z "$service" ]; then
        print_error "Service name required for restart"
        exit 1
    fi

    print_status "Restarting $service..."
    docker-compose restart "$service"
    print_success "$service restarted"
}

# Function to clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."

    # Remove stopped containers
    docker container prune -f

    # Remove unused images
    docker image prune -f

    # Remove unused networks
    docker network prune -f

    print_success "Cleanup completed"
}

# Function to backup databases
backup_databases() {
    print_status "Creating database backups..."

    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    # PostgreSQL backup
    print_status "Backing up PostgreSQL..."
    docker-compose exec -T postgres pg_dump -U postgres -d taskflow > "$backup_dir/postgres_backup.sql" 2>/dev/null || print_warning "PostgreSQL backup failed"

    # MongoDB backup
    print_status "Backing up MongoDB..."
    docker-compose exec -T mongodb mongodump --db taskflow --out /tmp/mongodb_backup 2>/dev/null || print_warning "MongoDB backup failed"
    docker cp $(docker-compose ps -q mongodb):/tmp/mongodb_backup "$backup_dir/" 2>/dev/null || print_warning "MongoDB backup copy failed"

    print_success "Backups saved to $backup_dir"
}

# Function to show usage
usage() {
    echo "TaskFlow Docker Deployment Script"
    echo ""
    echo "Usage: $0 COMMAND [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  dev              Deploy development environment"
    echo "  prod [env_file]  Deploy production environment (optional env file)"
    echo "  proxy [env_file] Deploy with nginx proxy (optional env file)"
    echo "  stop             Stop all services"
    echo "  status           Show service status"
    echo "  logs [service]   Show logs (all services if no service specified)"
    echo "  logs-follow      Follow logs for all services"
    echo "  restart <service> Restart specific service"
    echo "  cleanup          Clean up Docker resources"
    echo "  backup           Backup databases"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev                    # Deploy development"
    echo "  $0 prod                   # Deploy production"
    echo "  $0 prod .env.custom      # Deploy production with custom env"
    echo "  $0 proxy                  # Deploy with nginx proxy"
    echo "  $0 logs backend          # Show backend logs"
    echo "  $0 logs-follow           # Follow all logs"
    echo "  $0 restart frontend      # Restart frontend"
    echo "  $0 backup                # Backup databases"
}

# Main script
main() {
    # Check prerequisites
    check_docker
    check_compose

    case "${1:-help}" in
        dev)
            deploy_dev
            ;;
        prod)
            deploy_prod "$2"
            ;;
        proxy)
            deploy_with_proxy "$2"
            ;;
        stop)
            stop_all
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        logs-follow)
            show_logs "all" "follow"
            ;;
        restart)
            restart_service "$2"
            ;;
        cleanup)
            cleanup
            ;;
        backup)
            backup_databases
            ;;
        help|--help|-h)
            usage
            exit 0
            ;;
        *)
            print_error "Invalid command: $1"
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

