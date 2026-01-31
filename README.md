# Ruuvi Station with MongoDB

This project scans for Ruuvi sensor data via Bluetooth Low Energy and stores the readings in a MongoDB database.

## Prerequisites

- Docker and Docker Compose
- Deno runtime
- Bluetooth adapter on your machine

## Setup

1. **Start the MongoDB database:**

   ```bash
   deno task docker:up
   ```

   This will start:

   - MongoDB on port 27017
   - Mongo Express (web UI) on port 8081

2. **Access the database:**

   - MongoDB URI: `mongodb://admin:password123@localhost:27017/ruuvi_station`
   - Mongo Express web interface: http://localhost:8081

3. **Run the Ruuvi scanner:**
   ```bash
   deno task dev
   ```

## Database Structure

The sensor readings are stored in the `sensor_readings` collection with the following schema:

```javascript
{
  deviceName: "Ruuvi C2A9",
  mac: "AA:BB:CC:DD:EE:FF",
  timestamp: new Date(),
  temperature: 20.5,        // °C
  humidity: 45.2,           // %
  pressure: 101325,         // Pa
  accelerationX: 0,         // mg
  accelerationY: 0,         // mg
  accelerationZ: 1000,      // mg
  battery: 3200,            // mV
  txPower: 4,               // dBm
  movementCounter: 0,
  measurementSequenceNumber: 1,
  dataFormat: 5,
  rssi: -70                 // dBm
}
```

## Docker Commands

- Start services: `deno task docker:up`
- Stop services: `deno task docker:down`
- View logs: `deno task docker:logs`

## Configuration

You can modify the MongoDB connection settings in:

- `docker-compose.yml` - for Docker container settings
- `main.ts` - for the connection URI in the application

Default credentials:

- Username: `admin`
- Password: `password123`
- Database: `ruuvi_station`

## Monitoring

1. **Console Output:** The application logs all sensor readings to the console
2. **MongoDB:** All readings are automatically saved to the database
3. **Mongo Express:** Use the web interface at http://localhost:8081 to browse the data

## Troubleshooting

- Ensure Bluetooth is enabled on your system
- Make sure the Ruuvi sensor is broadcasting (check battery)
- Verify MongoDB is running: `docker-compose ps`
- Check application logs for any connection errors
