#!/bin/bash

# Script di avvio completo per Ruuvi Station
# Avvia Docker, cron.ts (con watch) e api/main.ts (con watch)

set -e

WORK_DIR="/home/pi/ruuvi-station"
LOG_DIR="/var/log/ruuvi-station"
DENO_BIN="$HOME/.deno/bin/deno"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 Ruuvi Station - Sistema Completo  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Crea la directory per i log se non esiste
# mkdir -p "$LOG_DIR"

# Cambia directory
cd "$WORK_DIR"

echo -e "${YELLOW}📍 Working directory:${NC} $WORK_DIR"
echo -e "${YELLOW}📍 Log directory:${NC} $LOG_DIR"
echo ""

# ============================================
# 1. Avvia Docker Compose
# ============================================
echo -e "${YELLOW}[1/3]${NC} ${BLUE}Avvio Docker Compose...${NC}"
deno run -A "$DENO_BIN" task docker:up >> "$LOG_DIR/docker.log" 2>&1 &
DOCKER_PID=$!
echo -e "${GREEN}✓ Docker avviato (PID: $DOCKER_PID)${NC}"
echo -e "${YELLOW}    Log: $LOG_DIR/docker.log${NC}"

# Aspetta che i container siano pronti
sleep 5

# ============================================
# 2. Avvia il servizio Cron (src/main.ts con watch)
# ============================================
echo ""
echo -e "${YELLOW}[2/3]${NC} ${BLUE}Avvio Cron Service (watch mode)...${NC}"
nohup "$DENO_BIN" run --allow-all --watch src/main.ts >> "$LOG_DIR/cron.log" 2>&1 &
CRON_PID=$!
echo -e "${GREEN}✓ Cron avviato (PID: $CRON_PID)${NC}"
echo -e "${YELLOW}    Log: $LOG_DIR/cron.log${NC}"

# ============================================
# 3. Avvia l'API (api/main.ts con watch)
# ============================================
echo ""
echo -e "${YELLOW}[3/3]${NC} ${BLUE}Avvio API Service (watch mode)...${NC}"
nohup "$DENO_BIN" run --allow-all --watch api/main.ts >> "$LOG_DIR/api.log" 2>&1 &
API_PID=$!
echo -e "${GREEN}✓ API avviato (PID: $API_PID)${NC}"
echo -e "${YELLOW}    Log: $LOG_DIR/api.log${NC}"

# ============================================
# Salva i PID in un file per il controllo
# ============================================
echo "$DOCKER_PID" > "$LOG_DIR/pids.txt"
echo "$CRON_PID" >> "$LOG_DIR/pids.txt"
echo "$API_PID" >> "$LOG_DIR/pids.txt"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}✅ Sistema avviato con successo!${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Processi attivi:${NC}"
echo -e "  ${BLUE}Docker${NC}   : PID $DOCKER_PID"
echo -e "  ${BLUE}Cron${NC}     : PID $CRON_PID"
echo -e "  ${BLUE}API${NC}      : PID $API_PID"
echo ""
echo -e "${YELLOW}Comandi utili:${NC}"
echo -e "  ${BLUE}tail -f $LOG_DIR/docker.log${NC}     # Log Docker"
echo -e "  ${BLUE}tail -f $LOG_DIR/cron.log${NC}       # Log Cron"
echo -e "  ${BLUE}tail -f $LOG_DIR/api.log${NC}        # Log API"
echo -e "  ${BLUE}tail -f $LOG_DIR/*.log${NC}          # Tutti i log"
echo ""

# Aspetta il completamento dei processi
wait
