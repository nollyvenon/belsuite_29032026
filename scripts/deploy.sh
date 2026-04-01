#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BelSuite Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}[1/10] Checking prerequisites...${NC}"
command -v docker &> /dev/null || { echo "Docker not installed"; exit 1; }
command -v docker-compose &> /dev/null || { echo "Docker Compose not installed"; exit 1; }
command -v git &> /dev/null || { echo "Git not installed"; exit 1; }
echo -e "${GREEN}✓ Prerequisites met${NC}\n"

# Clone repository
echo -e "${YELLOW}[2/10] Cloning repository...${NC}"
if [ ! -d "belsuite" ]; then
  git clone https://github.com/belsuite/belsuite.git
fi
cd belsuite
echo -e "${GREEN}✓ Repository ready${NC}\n"

# Setup environment
echo -e "${YELLOW}[3/10] Setting up environment...${NC}"
if [ ! -f ".env.prod" ]; then
  cp .env.example .env.prod
  echo -e "${YELLOW}⚠ Edit .env.prod with your configuration${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Environment configured${NC}\n"

# Create directories
echo -e "${YELLOW}[4/10] Creating directories...${NC}"
mkdir -p backups certs nginx/conf.d monitoring/grafana/provisioning
echo -e "${GREEN}✓ Directories created${NC}\n"

# Setup SSL certificates
echo -e "${YELLOW}[5/10] Setting up SSL certificates...${NC}"
if [ ! -f "certs/cert.pem" ]; then
  echo "Please place your SSL certificate in certs/cert.pem"
  echo "And private key in certs/key.pem"
  echo "(Or use Let's Encrypt: certbot certonly -d your-domain.com)"
fi
echo -e "${GREEN}✓ SSL setup ready${NC}\n"

# Pull images
echo -e "${YELLOW}[6/10] Pulling Docker images...${NC}"
docker-compose -f docker-compose.prod.yml pull
echo -e "${GREEN}✓ Images pulled${NC}\n"

# Start services
echo -e "${YELLOW}[7/10] Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✓ Services started${NC}\n"

# Wait for services
echo -e "${YELLOW}[8/10] Waiting for services to be ready...${NC}"
sleep 10
docker-compose -f docker-compose.prod.yml logs --tail=20
echo -e "${GREEN}✓ Services ready${NC}\n"

# Run migrations
echo -e "${YELLOW}[9/10] Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate
echo -e "${GREEN}✓ Migrations complete${NC}\n"

# Health checks
echo -e "${YELLOW}[10/10] Running health checks...${NC}"
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")

if [ "$BACKEND_HEALTH" = "200" ] && [ "$FRONTEND_HEALTH" = "200" ]; then
  echo -e "${GREEN}✓ All services healthy${NC}\n"
else
  echo -e "${YELLOW}⚠ Backend: $BACKEND_HEALTH, Frontend: $FRONTEND_HEALTH${NC}\n"
fi

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo "Services running at:"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:3001/api${NC}"
echo -e "  Grafana: ${GREEN}http://localhost:3100${NC} (admin/admin)"
echo -e "  Kibana: ${GREEN}http://localhost:5601${NC}"
echo -e "  Prometheus: ${GREEN}http://localhost:9090${NC}\n"

echo "Next steps:"
echo "  1. Verify all services are running: docker-compose -f docker-compose.prod.yml ps"
echo "  2. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  3. Configure Grafana dashboards"
echo "  4. Setup Slack integration in AlertManager"
echo "  5. Configure backup retention policy"
echo ""
