/**
 * MongoDB database service
 * Handles all database operations
 */

import { MongoClient, Db, Collection } from "mongodb";
import { SensorReading } from "../types/ruuvi.types.ts";
import { Logger } from "./logger.ts";

export class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private sensorCollection: Collection | null = null;
  private mongoUri: string;
  private logger = Logger.getInstance();

  constructor(mongoUri: string) {
    this.mongoUri = mongoUri;
  }

  /**
   * Connects to MongoDB database
   */
  async connect(): Promise<boolean> {
    try {
      this.logger.info("Connecting to MongoDB...");
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();

      this.db = this.client.db("ruuvi_station");
      this.sensorCollection = this.db.collection("sensor_readings");

      this.logger.info("Connected to MongoDB successfully");
      return true;
    } catch (error) {
      this.logger.error("Failed to connect to MongoDB:", error);
      return false;
    }
  }

  /**
   * Disconnects from MongoDB database
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.logger.info("Disconnected from MongoDB");
    }
  }

  /**
   * Saves a sensor reading to the database
   */
  async saveSensorReading(reading: SensorReading): Promise<string | null> {
    if (!this.sensorCollection) {
      this.logger.error("Sensor collection not initialized");
      return null;
    }

    try {
      const result = await this.sensorCollection.insertOne(reading);
      this.logger.info(`Data saved to MongoDB with ID: ${result.insertedId}`);
      return result.insertedId.toString();
    } catch (error) {
      this.logger.error("Error saving to MongoDB:", error);
      return null;
    }
  }

  /**
   * Gets the sensor collection for custom queries
   */
  getSensorCollection(): Collection | null {
    return this.sensorCollection;
  }

  /**
   * Checks if connected to database
   */
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}
