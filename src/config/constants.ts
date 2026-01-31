/**
 * Application configuration
 */

export const CONFIG = {
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb://admin:password123@localhost:27017/ruuvi_station?authSource=admin",
  MONGODB_DB_NAME: "ruuvi_station",
  MONGODB_COLLECTION_NAME: "sensor_readings",
  TARGET_DEVICE_NAME: "Ruuvi C2A9",
};
