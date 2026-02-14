#!/bin/bash

# Script di setup per Ruuvi Station con systemd
# Esegue automaticamente il servizio cron all'avvio del sistema

set -e

echo "🚀 Setup Ruuvi Station Systemd Service"
echo "========================================"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variabili configurabili
SERVICE_NAME="ruuvi-cron"
CURRENT_USER=$(whoami)
WORK_DIR=$(pwd)
DENO_BIN=$(which deno 2>/dev/null || echo "$HOME/.deno/bin/deno")

echo -e "${YELLOW}Utente corrente:${NC} $CURRENT_USER"
echo -e "${YELLOW}Directory di lavoro:${NC} $WORK_DIR"
echo -e "${YELLOW}Deno path:${NC} $DENO_BIN"
echo ""

# Verifica che Deno sia installato
if [ ! -f "$DENO_BIN" ]; then
    echo -e "${RED}❌ Deno non trovato!${NC}"
    echo "Installazione Deno in corso..."
    curl -fsSL https://deno.land/install.sh | sh
    DENO_BIN="$HOME/.deno/bin/deno"
    export PATH="$HOME/.deno/bin:$PATH"
    echo -e "${GREEN}✓ Deno installato${NC}"
else
    echo -e "${GREEN}✓ Deno già installato${NC}"
fi

# Verifica che il file cron.ts esista
if [ ! -f "$WORK_DIR/cron.ts" ]; then
    echo -e "${RED}❌ File cron.ts non trovato in $WORK_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✓ File cron.ts trovato${NC}"

# Crea il file service systemd
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

echo ""
echo "Creazione del service file systemd..."

sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Ruuvi Station Cron Service
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$WORK_DIR
ExecStart=$DENO_BIN run --allow-all $WORK_DIR/cron.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Limiti di risorse (opzionali)
MemoryMax=512M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Service file creato: $SERVICE_FILE${NC}"

# Ricarica systemd
echo ""
echo "Ricaricamento systemd daemon..."
sudo systemctl daemon-reload
echo -e "${GREEN}✓ Systemd daemon ricaricato${NC}"

# Abilita il servizio per l'avvio automatico
echo ""
echo "Abilitazione servizio all'avvio..."
sudo systemctl enable "$SERVICE_NAME.service"
echo -e "${GREEN}✓ Servizio abilitato per l'avvio automatico${NC}"

# Avvia il servizio
echo ""
echo "Avvio del servizio..."
sudo systemctl start "$SERVICE_NAME.service"
echo -e "${GREEN}✓ Servizio avviato${NC}"

# Attendi un momento per verificare lo stato
sleep 2

# Mostra lo stato del servizio
echo ""
echo "========================================"
echo "📊 Status del servizio:"
echo "========================================"
sudo systemctl status "$SERVICE_NAME.service" --no-pager

echo ""
echo -e "${GREEN}✅ Setup completato con successo!${NC}"
echo ""
echo "Comandi utili:"
echo "  • Stato:    sudo systemctl status $SERVICE_NAME"
echo "  • Stop:     sudo systemctl stop $SERVICE_NAME"
echo "  • Start:    sudo systemctl start $SERVICE_NAME"
echo "  • Restart:  sudo systemctl restart $SERVICE_NAME"
echo "  • Logs:     sudo journalctl -u $SERVICE_NAME -f"
echo "  • Disable:  sudo systemctl disable $SERVICE_NAME"
echo ""
