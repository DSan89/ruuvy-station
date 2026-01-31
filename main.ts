// mod.ts
import noble from "npm:@stoprocent/noble"; // Importa la libreria Noble da npm
import { Buffer } from "node:buffer";
import { MongoClient, Db, Collection } from "mongodb";

// MongoDB connection setup
const MONGODB_URI =
  "mongodb://admin:password123@localhost:27017/ruuvi_station?authSource=admin";
let db: Db;
let sensorCollection: Collection;
console.log("starting...");

async function connectToDatabase() {
  console.log("Connecting to MongoDB...");
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB successfully");

    db = client.db("ruuvi_station");
    sensorCollection = db.collection("sensor_readings");

    return true;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return false;
  }
}

// Initialize database connection
await connectToDatabase();

noble.on("stateChange", async (state: any) => {
  if (state === "poweredOn") {
    console.log("Scanning for BLE devices...");
    await noble.startScanningAsync([], true); // Avvia la scansione
  } else {
    await noble.stopScanningAsync(); // Interrompi la scansione se Bluetooth non è attivo
  }
});

noble.on("discover", async (peripheral: any) => {
  if ("Ruuvi C2A9" !== peripheral.advertisement.localName) return;
  const time = `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
  console.log(
    `****** New data from ${peripheral.advertisement.localName} ${time} *****`,
  );
  //console.log(peripheral.advertisement);
  const parsed = parseRawRuuvi(peripheral.advertisement.manufacturerData);

  //console.log("data received: " + parsed);
  console.log("temperature: " + parsed.temperature + "°C");
  console.log("humidity: " + parsed.humidity + "%");
  console.log("accelerationX: " + parsed.accelerationX);
  console.log("accelerationY: " + parsed.accelerationY);
  console.log("accelerationZ: " + parsed.accelerationZ);
  console.log("movements: " + parsed.movementCounter);
  console.log("pressure: " + parsed.pressure);
  console.log("battery: " + parsed.battery);
  console.log("txPower: " + parsed.txPower);
  console.log("measurementSequenceNumber: " + parsed.measurementSequenceNumber);
  console.log("\n");

  // Save to MongoDB
  try {
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

    const result = await sensorCollection.insertOne(sensorReading);
    console.log(`Data saved to MongoDB with IDD: ${result.insertedId}`);
  } catch (error) {
    console.error("Error saving to MongoDB:", error);
  }

  // Connettiti al dispositivo (sostituisci con l'indirizzo del tuo dispositivo)
  /* if (peripheral.address === "YOUR_DEVICE_ADDRESS") {
    await noble.stopScanningAsync();
    await peripheral.connectAsync();
    console.log("Connected to device!");

    // Scopri i servizi e le caratteristiche
    const { services } =
      await peripheral.discoverSomeServicesAndCharacteristicsAsync([], []);

    // Itera sui servizi e le caratteristiche
    for (const service of services) {
      console.log(`Service UUID: ${service.uuid}`);
      for (const characteristic of service.characteristics) {
        console.log(`  Characteristic UUID: ${characteristic.uuid}`);

        // Leggi il valore della caratteristica
        const data = await characteristic.readAsync();
        console.log(`    Data: ${data.toString("hex")}`);

        // Salva i dati nel database MongoDB
        // ...
      }
    }

    await peripheral.disconnectAsync();
  } */
});

function _bufferToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const _example = {
  id: "6afce934a6e320fb3b7aadbe640191d8",
  address: "",
  addressType: "unknown",
  connectable: true,
  advertisement: {
    localName: "Ruuvi C2A9",
    manufacturerData: {
      type: "Buffer",
      data: [
        153, 4, 5, 13, 211, 112, 113, 195, 37, 254, 136, 252, 56, 255, 112, 172,
        86, 174, 10, 239, 243, 48, 254, 47, 194, 169,
      ],
    },
    serviceUuids: ["6e400001b5a3f393e0a9e50e24dcca9e"],
  },
  rssi: -74,
  mtu: null,
  state: "disconnected",
};

type RuuwiDecoded = {
  temperature: number;
  humidity: number;
  pressure: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  battery: number;
  txPower: number;
  movementCounter: number;
  measurementSequenceNumber: number;
  mac: string;
  dataFormat: number;
};
const parseRawRuuvi = function (data: Buffer): RuuwiDecoded {
  const robject: Partial<RuuwiDecoded> = {};

  let temperature = (data[3] << 8) | (data[4] & 0xff);
  if (temperature > 32767) {
    temperature -= 65536;
  }
  robject.temperature = temperature / 200.0;
  //robject.temperature = round(robject.temperature, 2);

  if (!(data[5] === 255 && data[6] === 255)) {
    robject.humidity = (((data[5] & 0xff) << 8) | (data[6] & 0xff)) / 400.0;
  }

  if (!(data[7] === 255 && data[8] === 255)) {
    robject.pressure = (((data[7] & 0xff) << 8) | (data[8] & 0xff)) + 50000;
  }

  if (!(data[9] === 128 && data[10] === 0)) {
    let accelerationX = (data[9] << 8) | (data[10] & 0xff);
    if (accelerationX > 32767) accelerationX -= 65536; // two's complement
    robject.accelerationX = accelerationX;
  }

  if (!(data[11] === 128 && data[12] === 0)) {
    let accelerationY = (data[11] << 8) | (data[12] & 0xff);
    if (accelerationY > 32767) accelerationY -= 65536; // two's complement
    robject.accelerationY = accelerationY;
  }

  if (!(data[13] === 128 && data[14] === 0)) {
    let accelerationZ = (data[13] << 8) | (data[14] & 0xff);
    if (accelerationZ > 32767) accelerationZ -= 65536; // two's complement
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
  return robject as RuuwiDecoded;
};

function int2Hex(str: number) {
  return ("0" + str.toString(16).toUpperCase()).slice(-2);
}

export function round(number: number, _deciamals: number) {
  const f: number = 1;
  /*   for (let i = 0; i < deciamals; i++) f += "0";
  f = +f; */
  return Math.round(number * f) / f;
}
