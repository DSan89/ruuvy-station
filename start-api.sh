#!/bin/bash

# Script per eseguire api/main.ts in background

echo "🚀 Avvio API (api/main.ts) in background"
echo "=================================="
echo ""

# Colori
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

WORK_DIR=$(pwd)
LOG_DIR="$WORK_DIR/log"
LOG_FILE="$LOG_DIR/api.log"

# Crea la directory dei log se non esiste
mkdir -p "$LOG_DIR"

echo -e "${YELLOW}Directory:${NC} $WORK_DIR"
echo -e "${YELLOW}Log file:${NC} $LOG_FILE"
echo ""

deno run --allow-net --unstable-cron cron.ts > log/cron.log 2>&1 &

# Esegui api/main.ts con Deno in background
nohup deno run --allow-all "$WORK_DIR/api/main.ts" > "$LOG_FILE" 2>&1 &
PID=$!

echo -e "${GREEN}✓ api/main.ts avviato in background${NC}"
echo -e "${GREEN}PID: $PID${NC}"
echo ""
echo "Comandi utili:"
echo "  • Logs:  tail -f $LOG_FILE"
echo "  • Stop:  kill $PID"
