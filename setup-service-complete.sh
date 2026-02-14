#!/bin/bash

# Script di setup per il servizio completo Ruuvi Station
# Configura il servizio systemd per l'avvio automatico

set -e

SERVICE_NAME="ruuvi-station-all"
CURRENT_USER=$(whoami)
WORK_DIR=$(pwd)
SCRIPT_PATH="$WORK_DIR/start-all.sh"

echo "🚀 Setup Ruuvi Station Complete Service"
echo "========================================"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Utente:${NC} $CURRENT_USER"
echo -e "${YELLOW}Directory:${NC} $WORK_DIR"
echo -e "${YELLOW}Script:${NC} $SCRIPT_PATH"
echo ""

# Rendi eseguibile lo script
chmod +x "$SCRIPT_PATH"
echo -e "${GREEN}✓ Script reso eseguibile${NC}"

# Crea il file service systemd
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

echo "Creazione del service file systemd..."

sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Ruuvi Station Complete Service (Docker + Cron + API)
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$WORK_DIR
ExecStart=$SCRIPT_PATH
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

# Limiti di risorse
MemoryMax=2G
CPUQuota=100%

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Service file creato: $SERVICE_FILE${NC}"

# Ricarica systemd
echo "Ricaricamento systemd daemon..."
sudo systemctl daemon-reload
echo -e "${GREEN}✓ Systemd daemon ricaricato${NC}"

# Abilita il servizio
echo "Abilitazione del servizio..."
sudo systemctl enable "$SERVICE_NAME.service"
echo -e "${GREEN}✓ Servizio abilitato${NC}"

# Avvia il servizio
echo "Avvio del servizio..."
sudo systemctl start "$SERVICE_NAME.service"
echo -e "${GREEN}✓ Servizio avviato${NC}"

# Aspetta un momento per il caricamento
sleep 3

# Mostra lo stato
echo ""
echo "========================================"
echo "📊 Status del servizio:"
echo "========================================"
sudo systemctl status "$SERVICE_NAME.service" --no-pager || true

echo ""
echo -e "${GREEN}✅ Setup completato!${NC}"
echo ""
echo "Comandi utili:"
echo "  • Status:    sudo systemctl status $SERVICE_NAME"
echo "  • Stop:      sudo systemctl stop $SERVICE_NAME"
echo "  • Start:     sudo systemctl start $SERVICE_NAME"
echo "  • Restart:   sudo systemctl restart $SERVICE_NAME"
echo "  • Logs:      sudo journalctl -u $SERVICE_NAME -f"
echo "  • All logs:  sudo journalctl -u $SERVICE_NAME --no-pager | tail -50"
echo "  • Disable:   sudo systemctl disable $SERVICE_NAME"
echo ""
