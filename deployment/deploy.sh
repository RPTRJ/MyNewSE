#!/bin/bash
# ==============================================================================
# Deployment Script - MySE Portfolio
# ==============================================================================
# Usage:
#   ./deploy.sh              # Full deploy
#   ./deploy.sh status       # Show status
#   ./deploy.sh logs         # Show logs
#   ./deploy.sh restart      # Restart containers
#   ./deploy.sh down         # Stop all
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed!"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "$COMPOSE_FILE not found!"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "$ENV_FILE not found!"
        log_info "Create it: cp .env.prod.template .env.prod"
        exit 1
    fi
    
    log_success "All requirements met"
}

show_status() {
    echo ""
    log_info "Container Status:"
    echo "=================================================="
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps
    echo ""
    
    log_info "Health Check:"
    echo "=================================================="
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null | grep -q "200"; then
        log_success "Nginx: OK"
    else
        log_warning "Nginx: Not responding"
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null | grep -q "200"; then
        log_success "Backend API: OK"
    else
        log_warning "Backend API: Not responding"
    fi
    echo ""
}

full_deploy() {
    log_info "Starting deployment..."
    echo "=================================================="
    
    check_requirements
    
    log_info "Stopping existing containers..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down 2>/dev/null || true
    
    log_info "Pulling latest images..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE pull
    
    log_info "Starting containers..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    
    log_info "Cleaning up old images..."
    docker image prune -f
    
    log_info "Waiting for services to start..."
    sleep 15
    
    show_status
    
    echo "=================================================="
    log_success "Deployment completed!"
    echo "=================================================="
}

case "${1:-deploy}" in
    status|ps)
        show_status
        ;;
    logs)
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f
        ;;
    restart)
        check_requirements
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE restart
        sleep 10
        show_status
        ;;
    down|stop)
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down
        log_success "Containers stopped"
        ;;
    pull)
        check_requirements
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE pull
        log_success "Images pulled"
        ;;
    deploy|"")
        full_deploy
        ;;
    *)
        echo "Usage: $0 {deploy|status|logs|restart|down|pull}"
        exit 1
        ;;
esac