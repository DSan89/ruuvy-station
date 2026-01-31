# Guida: Eseguire Ruuvi Station su Android

Questa guida ti mostra come trasformare il tuo telefono Android in un server per raccogliere dati dai sensori Ruuvi.

## 📱 Opzione 1: Termux + Node.js (Consigliata)

### Requisiti

- Android 7.0 o superiore
- Bluetooth attivo
- Connessione Internet per installazione

### Passo 1: Installa Termux

```bash
# Scarica Termux da F-Droid (raccomandato) o GitHub
# NON da Google Play Store (versione obsoleta)
```

**Link:** https://f-droid.org/packages/com.termux/

### Passo 2: Configurazione iniziale Termux

```bash
# Aggiorna i pacchetti
pkg update && pkg upgrade

# Installa dipendenze necessarie
pkg install nodejs npm python make clang

# Abilita storage
termux-setup-storage

# Installa dipendenze per Bluetooth
pkg install bluetooth-utils
```

### Passo 3: Trasferisci il progetto

```bash
# Crea directory di lavoro
mkdir ~/ruuvi-station
cd ~/ruuvi-station

# Copia i file del progetto (android-nodejs/) sul telefono
# Puoi usare:
# - adb push (se hai debug USB abilitato)
# - Email/Drive/Cloud storage
# - git clone (se hai un repository)
```

### Passo 4: Installa dipendenze

```bash
cd ~/ruuvi-station
npm install
```

### Passo 5: Configurazioni Android

```bash
# Abilita permessi Bluetooth per Termux
# Vai in Impostazioni > App > Termux > Permessi
# Abilita "Posizione" (necessario per BLE)
```

### Passo 6: Avvia il server

```bash
node main.js
```

Il server sarà disponibile su:

- **Locale**: http://localhost:3000
- **Rete**: http://[IP_DEL_TELEFONO]:3000

### Passo 7: Trova l'IP del telefono

```bash
# In Termux
ifconfig wlan0 | grep inet
# Oppure
ip addr show wlan0
```

## 📱 Opzione 2: App React Native + SQLite

Creiamo un'app nativa che fa tutto internamente:

### Struttura App Nativa

```javascript
// App.js - React Native con Bluetooth e SQLite
import React, { useState, useEffect } from "react";
import { BleManager } from "react-native-ble-plx";
import SQLite from "react-native-sqlite-storage";

// Inizializza BLE e Database
const bleManager = new BleManager();
const db = SQLite.openDatabase({ name: "ruuvi.db" });

export default function RuuviApp() {
  const [sensorData, setSensorData] = useState(null);

  useEffect(() => {
    initDatabase();
    startScanning();
  }, []);

  const initDatabase = () => {
    db.transaction((tx) => {
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER,
          temperature REAL,
          humidity REAL,
          pressure REAL,
          battery REAL
        )
      `);
    });
  };

  const startScanning = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (device?.localName === "Ruuvi C2A9") {
        const parsed = parseRuuviData(device.manufacturerData);
        saveToDatabase(parsed);
        setSensorData(parsed);
      }
    });
  };

  // ... resto dell'implementazione
}
```

## 🔧 Opzione 3: Progressive Web App (PWA)

Una web app che usa Web Bluetooth API:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Ruuvi PWA</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="manifest" href="manifest.json" />
  </head>
  <body>
    <button id="connect">Connetti Ruuvi</button>
    <div id="data"></div>

    <script>
      let device;

      document.getElementById("connect").onclick = async () => {
        try {
          device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Ruuvi" }],
            optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"],
          });

          const server = await device.gatt.connect();
          // ... gestione dati
        } catch (error) {
          console.error("Errore Bluetooth:", error);
        }
      };
    </script>
  </body>
</html>
```

## 🚀 Setup Rapido per Termux

### Script di installazione automatica:

```bash
#!/bin/bash
# install_ruuvi_android.sh

echo "🔧 Installing Ruuvi Station on Android..."

# Update packages
pkg update -y && pkg upgrade -y

# Install required packages
pkg install -y nodejs npm python make clang git

# Enable storage access
termux-setup-storage

# Clone or create project
mkdir -p ~/ruuvi-station
cd ~/ruuvi-station

# Create package.json if not exists
cat > package.json << 'EOF'
{
  "name": "ruuvi-station-android",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node main.js"
  },
  "dependencies": {
    "@stoprocent/noble": "^1.9.3",
    "sqlite3": "^5.1.6",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# Install dependencies
npm install

echo "✅ Installation complete!"
echo "📱 Now copy main.js to ~/ruuvi-station/"
echo "🚀 Then run: node main.js"
```

## 📊 Funzionalità del Server Android

### API Endpoints disponibili:

- `GET /api/latest` - Ultima lettura
- `GET /api/history` - Storico dati
- `GET /api/stats` - Statistiche
- `GET /api/status` - Stato sistema

### Database SQLite

I dati vengono salvati in un file SQLite locale `ruuvi_data.db`

### Web Interface

Puoi accedere ai dati da qualsiasi dispositivo sulla stessa rete WiFi.

## 🛠️ Troubleshooting

### Bluetooth non funziona

```bash
# Verifica permessi Bluetooth
pkg install bluetooth-utils
bluetoothctl list

# Abilita posizione nelle impostazioni Android
# Termux > Permessi > Posizione
```

### Errori di compilazione

```bash
# Reinstalla node-gyp
npm install -g node-gyp

# Pulisci cache npm
npm cache clean --force
```

### Non riceve dati

```bash
# Verifica che il sensore Ruuvi sia acceso
# Controlla che sia nelle vicinanze
# Verifica i log: node main.js
```

## 🔋 Ottimizzazioni per Android

### Risparmio Batteria

```javascript
// Riduci frequenza scanning
setInterval(() => {
  if (noDataReceived > 60000) {
    // 1 minuto
    // Aumenta intervallo scanning
  }
}, 30000);
```

### Gestione Memoria

```javascript
// Limita dati in memoria
setInterval(() => {
  // Pulisci vecchi dati (>24h)
  db.run("DELETE FROM sensor_readings WHERE timestamp < ?", [
    Date.now() - 24 * 60 * 60 * 1000,
  ]);
}, 60 * 60 * 1000); // ogni ora
```

## 📱 Vantaggi della Soluzione Android

✅ **Portabile**: Il telefono è sempre con te  
✅ **Sempre online**: Connessione mobile  
✅ **Batteria lunga**: Telefoni moderni durano tutto il giorno  
✅ **WiFi hotspot**: Può condividere dati con altri dispositivi  
✅ **Storage locale**: Non dipende da server esterni

## 🎯 Utilizzo Finale

1. **Avvia Termux**
2. **Esegui**: `cd ~/ruuvi-station && node main.js`
3. **Accedi da browser**: `http://[IP_TELEFONO]:3000`
4. **Monitora i dati** in tempo reale!

Il tuo telefono Android diventa così un server completo per i sensori Ruuvi! 🚀
