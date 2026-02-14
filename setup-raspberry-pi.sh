#!/bin/bash

# Script di setup per Ruuvi Station su Raspberry Pi
# Configura il servizio systemd per l'avvio automatico di Docker, main.ts e api/main.ts

set -e

echo "🚀 Setup Ruuvi Station per Raspberry Pi"
echo "========================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICE_NAME="ruuvi-station"
CURRENT_USER=$(whoami)
WORK_DIR=$(pwd)

echo -e "${YELLOW}Utente:${NC} $CURRENT_USER"
echo -e "${YELLOW}Directory:${NC} $WORK_DIR"
echo ""

# Verifica i permessi di sudo
if ! sudo -n true 2>/dev/null; then
    echo -e "${RED}❌ Questo script richiede permessi sudo${NC}"
    exit 1
fi

# Rendi eseguibili gli script
echo "Configurazione degli script..."
chmod +x "$WORK_DIR/start-docker.sh"
chmod +x "$WORK_DIR/start-main.sh"
chmod +x "$WORK_DIR/start-api.sh"
echo -e "${GREEN}✓ Script resi eseguibili${NC}"
echo ""

# Crea lo script wrapper che avvia tutto
WRAPPER_SCRIPT="$WORK_DIR/start-all-raspberry.sh"
echo "Creazione dello script wrapper..."

tee "$WRAPPER_SCRIPT" > /dev/null <<'WRAPPER_EOF'
#!/bin/bash

# Script wrapper per avviare tutti i servizi su Raspberry Pi
# Avvia Docker Compose, main.ts e api/main.ts in background

WORK_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
LOG_DIR="$WORK_DIR/log"

mkdir -p "$LOG_DIR"

# Attendi che il sistema sia pronto
sleep 5

echo "🚀 Avvio dei servizi Ruuvi Station..."

# Avvia Docker Compose
cd "$WORK_DIR"
"$WORK_DIR/start-docker.sh" > "$LOG_DIR/docker-startup.log" 2>&1 &

# Attendi che MongoDB sia pronto
echo "Attesa di MongoDB..."
sleep 10

# Avvia main.ts
"$WORK_DIR/start-main.sh" > /dev/null 2>&1

# Avvia api/main.ts
"$WORK_DIR/start-api.sh" > /dev/null 2>&1

echo "✓ Tutti i servizi avviati"
WRAPPER_EOF

chmod +x "$WRAPPER_SCRIPT"
echo -e "${GREEN}✓ Script wrapper creato: $WRAPPER_SCRIPT${NC}"
echo ""

# Crea il file service systemd
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

echo "Creazione del service file systemd..."

sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Ruuvi Station Services (Docker + Main + API)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$WORK_DIR
ExecStart=$WRAPPER_SCRIPT
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

# Limiti di risorse per Raspberry Pi
MemoryMax=1G
CPUQuota=80%

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Service file creato: $SERVICE_FILE${NC}"
echo ""

# Ricarica systemd
echo "Ricaricamento systemd daemon..."
sudo systemctl daemon-reload
echo -e "${GREEN}✓ Systemd daemon ricaricato${NC}"
echo ""

# Abilita il servizio
echo "Abilitazione del servizio all'avvio..."
sudo systemctl enable "$SERVICE_NAME.service"
echo -e "${GREEN}✓ Servizio abilitato${NC}"
echo ""

# Mostra le informazioni finali
echo "========================================"
echo -e "${GREEN}✅ Setup completato con successo!${NC}"
echo "========================================"
echo ""
echo "📋 Comandi utili:"
echo "  • Status:    sudo systemctl status $SERVICE_NAME"
echo "  • Start:     sudo systemctl start $SERVICE_NAME"
echo "  • Stop:      sudo systemctl stop $SERVICE_NAME"
echo "  • Restart:   sudo systemctl restart $SERVICE_NAME"
echo "  • Logs:      sudo journalctl -u $SERVICE_NAME -f"
echo "  • All logs:  sudo journalctl -u $SERVICE_NAME --no-pager | tail -100"
echo ""
echo "📝 Log files:"
echo "  • Docker:    tail -f $WORK_DIR/log/docker-startup.log"
echo "  • Main:      tail -f $WORK_DIR/log/main.log"
echo "  • API:       tail -f $WORK_DIR/log/api.log"
echo ""
