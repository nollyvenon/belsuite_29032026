#!/bin/bash

# Belsuite Setup Script
# This script initializes a complete development environment

set -e

echo "🚀 Belsuite Development Setup"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18.17+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm 9.0+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env created. Please update with your configuration.${NC}"
else
    echo -e "${YELLOW}⚠ .env already exists. Skipping...${NC}"
fi

# Database setup
echo -e "\n${YELLOW}Setting up database...${NC}"

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL CLI not found. Using Docker instead...${NC}"
    if command -v docker &> /dev/null; then
        echo -e "${YELLOW}Starting Docker containers...${NC}"
        docker-compose down --remove-orphans 2>/dev/null || true
        docker-compose up -d postgres redis meilisearch
        sleep 10
        echo -e "${GREEN}✓ Docker containers started${NC}"
    else
        echo -e "${RED}❌ Docker not found. Please install Docker or PostgreSQL.${NC}"
        exit 1
    fi
fi

# Generate Prisma client
echo -e "\n${YELLOW}Generating Prisma client...${NC}"
npm run build:prisma

# Run migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
npm run db:migrate

# Seed database (optional)
read -p "Do you want to seed sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Seeding database...${NC}"
    npm run db:seed
fi

# Build backend
echo -e "\n${YELLOW}Building backend...${NC}"
npm run build:backend

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update .env with your configuration"
echo "2. Run 'npm run dev' to start development server"
echo "3. Backend: http://localhost:3001"
echo "4. Frontend: http://localhost:3000"
echo "5. API Docs: http://localhost:3001/api/docs"
