#!/bin/bash
# Health check script for TaskFlow deployment validation

set -e

ENVIRONMENT=${1:-"production"}
TIMEOUT=${2:-30}

# Configuration based on environment
case $ENVIRONMENT in
    "development")
        API_URL="http://localhost:3001"
        FRONTEND_URL="http://localhost:3000"
        ;;
    "staging")
        API_URL="https://api-staging.taskflow.example.com"
        FRONTEND_URL="https://staging.taskflow.example.com"
        ;;
    "production")
        API_URL="https://api.taskflow.example.com"
        FRONTEND_URL="https://taskflow.example.com"
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

echo "🔍 Running health checks for $ENVIRONMENT environment..."
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local expected_code=${2:-200}
    local timeout=$TIMEOUT

    echo "Checking $url..."

    local response
    response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
        --max-time $timeout \
        -H "User-Agent: TaskFlow-HealthCheck/1.0" \
        "$url" 2>/dev/null)

    local http_code
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://' | sed -e 's/;TIME.*//')
    local response_time
    response_time=$(echo "$response" | tr -d '\n' | sed -e 's/.*TIME://')

    if [ "$http_code" = "$expected_code" ]; then
        echo "✅ $url - HTTP $http_code (${response_time}s)"
        return 0
    else
        echo "❌ $url - HTTP $http_code (expected $expected_code)"
        return 1
    fi
}

# Function to check API health
check_api_health() {
    echo "🏥 Checking API health..."

    # Basic health endpoint
    if ! check_endpoint "$API_URL/health"; then
        echo "❌ API health check failed"
        return 1
    fi

    # API documentation endpoint
    if ! check_endpoint "$API_URL/api/docs" 200; then
        echo "⚠️  API docs not accessible (non-critical)"
    fi

    # Database connectivity check
    if check_endpoint "$API_URL/health/database"; then
        echo "✅ Database connection healthy"
    else
        echo "❌ Database connection failed"
        return 1
    fi

    # Redis connectivity check
    if check_endpoint "$API_URL/health/redis"; then
        echo "✅ Redis connection healthy"
    else
        echo "❌ Redis connection failed"
        return 1
    fi

    # WebSocket health (if applicable)
    if check_endpoint "$API_URL/health/websocket"; then
        echo "✅ WebSocket service healthy"
    else
        echo "⚠️  WebSocket service not accessible (may be expected)"
    fi

    return 0
}

# Function to check frontend health
check_frontend_health() {
    echo "🌐 Checking frontend health..."

    # Main page
    if ! check_endpoint "$FRONTEND_URL"; then
        echo "❌ Frontend health check failed"
        return 1
    fi

    # API health through frontend
    if check_endpoint "$FRONTEND_URL/api/health"; then
        echo "✅ Frontend API proxy healthy"
    else
        echo "⚠️  Frontend API proxy not accessible"
    fi

    return 0
}

# Function to check external dependencies
check_external_dependencies() {
    echo "🔗 Checking external dependencies..."

    # Check if we can reach external services (if any)
    # Add specific checks for external APIs, databases, etc.

    return 0
}

# Main health check execution
FAILED_CHECKS=0

echo "========================================"
echo "TaskFlow Health Check - $ENVIRONMENT"
echo "========================================"

# API Health Checks
if ! check_api_health; then
    ((FAILED_CHECKS++))
fi

echo ""

# Frontend Health Checks
if ! check_frontend_health; then
    ((FAILED_CHECKS++))
fi

echo ""

# External Dependencies
if ! check_external_dependencies; then
    ((FAILED_CHECKS++))
fi

echo ""
echo "========================================"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo "🎉 All health checks passed!"
    echo "✅ Deployment validation successful"
    exit 0
else
    echo "❌ $FAILED_CHECKS health check(s) failed"
    echo "❌ Deployment validation failed"
    exit 1
fi

