#!/bin/bash

# Script per avviare Docker Compose (MongoDB e Mongo Express)
# MongoDB sarà disponibile sulla porta 27017
# Mongo Express sarà disponibile su http://localhost:8081

set -e

echo "🐳 Avvio Docker Compose..."
echo "=================================="
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

WORK_DIR=$(pwd)

echo -e "${YELLOW}Directory:${NC} $WORK_DIR"
echo ""

# Avvia il docker-compose
docker-compose up -d

echo ""
echo -e "${GREEN}✓ Docker Compose avviato${NC}"
echo ""
echo "=================================="
echo "📊 Servizi disponibili:"
echo "=================================="
echo "  • MongoDB:      localhost:27017"
echo "  • Mongo Express: http://localhost:8081"
echo "    - Username: admin"
echo "    - Password: password123"
echo ""
echo "Comandi utili:"
echo "  • Logs:       docker-compose logs -f"
echo "  • Stop:       docker-compose down"
echo "  • Status:     docker-compose ps"
echo ""
