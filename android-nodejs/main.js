// Versione Node.js per Android (Termux)
import noble from "@stoprocent/noble";
import sqlite3 from "sqlite3";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurazione database SQLite (più leggero per mobile)
const dbPath = join(__dirname, "ruuvi_data.db");
const db = new sqlite3.Database(dbPath);

// Inizializza database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deviceName TEXT,
    mac TEXT,
    timestamp INTEGER,
    temperature REAL,
    humidity REAL,
    pressure REAL,
    accelerationX REAL,
    accelerationY REAL,
    accelerationZ REAL,
    battery REAL,
    txPower REAL,
    movementCounter INTEGER,
    measurementSequenceNumber INTEGER,
    dataFormat INTEGER,
    rssi INTEGER,
    rawData TEXT
  )`);
});

// API Server
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint per ottenere le ultime letture
app.get("/api/latest", (req, res) => {
  db.get(
    "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1",
    (err, row) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: row || null });
      }
    }
  );
});

// Endpoint per storico
app.get("/api/history", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const hours = parseInt(req.query.hours) || 24;
  const since = Date.now() - hours * 60 * 60 * 1000;

  db.all(
    "SELECT * FROM sensor_readings WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT ?",
    [since, limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: rows });
      }
    }
  );
});

// Endpoint per statistiche
app.get("/api/stats", (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const since = Date.now() - hours * 60 * 60 * 1000;

  db.get(
    `
    SELECT 
      AVG(temperature) as avgTemp,
      MIN(temperature) as minTemp,
      MAX(temperature) as maxTemp,
      AVG(humidity) as avgHumidity,
      MIN(humidity) as minHumidity,
      MAX(humidity) as maxHumidity,
      AVG(pressure) as avgPressure,
      COUNT(*) as count,
      MAX(timestamp) as lastReading
    FROM sensor_readings 
    WHERE timestamp >= ?
  `,
    [since],
    (err, row) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: row });
      }
    }
  );
});

// Endpoint per stato
app.get("/api/status", (req, res) => {
  db.get("SELECT COUNT(*) as total FROM sensor_readings", (err, countRow) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }

    db.get(
      "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1",
      (err, latest) => {
        if (err) {
          res.status(500).json({ success: false, error: err.message });
          return;
        }

        const isRecent =
          latest && Date.now() - latest.timestamp < 5 * 60 * 1000;

        res.json({
          success: true,
          data: {
            totalReadings: countRow.total,
            lastReading: latest?.timestamp || null,
            isReceivingData: isRecent,
            device: latest?.deviceName || null,
            mac: latest?.mac || null,
          },
        });
      }
    );
  });
});

// Funzione per salvare dati nel database
function saveToDatabase(sensorReading) {
  const stmt = db.prepare(`
    INSERT INTO sensor_readings (
      deviceName, mac, timestamp, temperature, humidity, pressure,
      accelerationX, accelerationY, accelerationZ, battery, txPower,
      movementCounter, measurementSequenceNumber, dataFormat, rssi, rawData
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    [
      sensorReading.deviceName,
      sensorReading.mac,
      sensorReading.timestamp,
      sensorReading.temperature,
      sensorReading.humidity,
      sensorReading.pressure,
      sensorReading.accelerationX,
      sensorReading.accelerationY,
      sensorReading.accelerationZ,
      sensorReading.battery,
      sensorReading.txPower,
      sensorReading.movementCounter,
      sensorReading.measurementSequenceNumber,
      sensorReading.dataFormat,
      sensorReading.rssi,
      JSON.stringify(sensorReading.rawData),
    ],
    function (err) {
      if (err) {
        console.error("Error saving to database:", err);
      } else {
        console.log(`Data saved to SQLite with ID: ${this.lastID}`);
      }
    }
  );

  stmt.finalize();
}

// Bluetooth scanning logic
noble.on("stateChange", async (state) => {
  if (state === "poweredOn") {
    console.log("🔍 Scanning for BLE devices...");
    await noble.startScanningAsync([], true);
  } else {
    await noble.stopScanningAsync();
  }
});

noble.on("discover", async (peripheral) => {
  if ("Ruuvi C2A9" !== peripheral.advertisement.localName) return;

  const time = new Date().toLocaleTimeString();
  console.log(`📡 New data from ${peripheral.advertisement.localName} ${time}`);

  const parsed = parseRawRuuvi(peripheral.advertisement.manufacturerData);

  console.log(`🌡️  Temperature: ${parsed.temperature}°C`);
  console.log(`💧 Humidity: ${parsed.humidity}%`);
  console.log(`📊 Pressure: ${parsed.pressure} Pa`);
  console.log(`🔋 Battery: ${parsed.battery} mV`);
  console.log(`📶 RSSI: ${peripheral.rssi} dBm`);
  console.log("---");

  // Salva nel database
  const sensorReading = {
    deviceName: peripheral.advertisement.localName,
    mac: parsed.mac,
    timestamp: Date.now(),
    temperature: parsed.temperature,
    humidity: parsed.humidity,
    pressure: parsed.pressure,
    accelerationX: parsed.accelerationX,
    accelerationY: parsed.accelerationY,
    accelerationZ: parsed.accelerationZ,
    battery: parsed.battery,
    txPower: parsed.txPower,
    movementCounter: parsed.movementCounter,
    measurementSequenceNumber: parsed.measurementSequenceNumber,
    dataFormat: parsed.dataFormat,
    rssi: peripheral.rssi,
    rawData: peripheral.advertisement.manufacturerData,
  };

  saveToDatabase(sensorReading);
});

// Parsing function (same as your Deno version)
function parseRawRuuvi(data) {
  const robject = {};

  let temperature = (data[3] << 8) | (data[4] & 0xff);
  if (temperature > 32767) {
    temperature -= 65536;
  }
  robject.temperature = temperature / 200.0;

  if (!(data[5] === 255 && data[6] === 255)) {
    robject.humidity = (((data[5] & 0xff) << 8) | (data[6] & 0xff)) / 400.0;
  }

  if (!(data[7] === 255 && data[8] === 255)) {
    robject.pressure = (((data[7] & 0xff) << 8) | (data[8] & 0xff)) + 50000;
  }

  if (!(data[9] === 128 && data[10] === 0)) {
    let accelerationX = (data[9] << 8) | (data[10] & 0xff);
    if (accelerationX > 32767) accelerationX -= 65536;
    robject.accelerationX = accelerationX;
  }

  if (!(data[11] === 128 && data[12] === 0)) {
    let accelerationY = (data[11] << 8) | (data[12] & 0xff);
    if (accelerationY > 32767) accelerationY -= 65536;
    robject.accelerationY = accelerationY;
  }

  if (!(data[13] === 128 && data[14] === 0)) {
    let accelerationZ = (data[13] << 8) | (data[14] & 0xff);
    if (accelerationZ > 32767) accelerationZ -= 65536;
    robject.accelerationZ = accelerationZ;
  }

  const powerInfo = ((data[15] & 0xff) << 8) | (data[16] & 0xff);
  robject.battery = (powerInfo >>> 5) + 1600;
  robject.txPower = (powerInfo & 0b11111) * 2 - 40;
  robject.movementCounter = data[17] & 0xff;
  robject.measurementSequenceNumber =
    ((data[18] & 0xff) << 8) | (data[19] & 0xff);
  robject.mac = [
    int2Hex(data[20]),
    int2Hex(data[21]),
    int2Hex(data[22]),
    int2Hex(data[23]),
    int2Hex(data[24]),
    int2Hex(data[25]),
  ].join(":");
  robject.dataFormat = 5;

  return robject;
}

function int2Hex(str) {
  return ("0" + str.toString(16).toUpperCase()).slice(-2);
}

// Avvia il server API
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Access from other devices: http://[YOUR_PHONE_IP]:${PORT}`);
  console.log(`💾 Database: ${dbPath}`);
});
