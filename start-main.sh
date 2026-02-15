#!/bin/bash

# Script per eseguire main.ts in background

echo "🚀 Avvio main.ts in background"
echo "=================================="
echo ""

# Colori
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

WORK_DIR=$(pwd)
LOG_DIR="$WORK_DIR/log"
LOG_FILE="$LOG_DIR/main.log"

# Crea la directory dei log se non esiste
mkdir -p "$LOG_DIR"

echo -e "${YELLOW}Directory:${NC} $WORK_DIR"
echo -e "${YELLOW}Log file:${NC} $LOG_FILE"
echo ""

# Esegui main.js con Node.js in background
nohup npm run dev > "$LOG_FILE" 2>&1 &
PID=$!

echo -e "${GREEN}✓ main.js avviato in background${NC}"
echo -e "${GREEN}PID: $PID${NC}"
echo ""
echo "Comandi utili:"
echo "  • Logs:  tail -f $LOG_FILE"
echo "  • Stop:  kill $PID"
