console.log(db);
// MongoDB initialization script
db = db.getSiblingDB("ruuvi_station");

// Create a collection for sensor readings
db.createCollection("sensor_readings");

// Create indexes for better performance
db.sensor_readings.createIndex({ timestamp: 1 });
db.sensor_readings.createIndex({ mac: 1 });
db.sensor_readings.createIndex({ deviceName: 1 });

// Insert a sample document to verify the structure
db.sensor_readings.insertOne({
  deviceName: "Ruuvi C2A9",
  mac: "00:00:00:00:00:00",
  timestamp: new Date(),
  temperature: 20.5,
  humidity: 45.2,
  pressure: 101325,
  accelerationX: 0,
  accelerationY: 0,
  accelerationZ: 1000,
  battery: 3200,
  txPower: 4,
  movementCounter: 0,
  measurementSequenceNumber: 1,
  dataFormat: 5,
  rssi: -70,
});

print("Database initialized successfully");
