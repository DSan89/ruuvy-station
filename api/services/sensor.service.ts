/**
 * Sensor data service
 * Handles database queries for sensor readings
 */

import { Collection, Db, MongoClient } from "mongodb";

export type SensorReading = {
  _id?: string;
  deviceName: string;
  mac: string;
  timestamp: number;
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
  dataFormat: number;
  rssi: number;
};

export type QueryParams = {
  limit?: number;
  skip?: number;
  startTime?: number;
  endTime?: number;
  deviceName?: string;
};

export class SensorService {
  private db: Db | null = null;
  private collection: Collection<SensorReading> | null = null;
  private configCollection: Collection<any> | null = null;

  constructor(private mongoUri: string) {}

  async connect(): Promise<void> {
    const client = new MongoClient(this.mongoUri);
    await client.connect();
    this.db = client.db("ruuvi_station");
    this.collection = this.db.collection<SensorReading>("sensor_readings");
    this.configCollection = this.db.collection("config");
    console.log("Connected to MongoDB");
  }

  async getLatestReadings(limit: number = 10): Promise<SensorReading[]> {
    if (!this.collection) throw new Error("Database not connected");

    return await this.collection
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async getReadingsByDevice(
    deviceName: string,
    limit: number = 50,
  ): Promise<SensorReading[]> {
    if (!this.collection) throw new Error("Database not connected");
    return (await this.collection
      .find({ deviceName })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()) as SensorReading[];
  }

  async getReadingsByTimeRange(
    startTime: number,
    endTime: number,
    params: QueryParams = {},
  ): Promise<SensorReading[]> {
    if (!this.collection) throw new Error("Database not connected");

    const query: any = {
      timestamp: { $gte: startTime, $lte: endTime },
    };

    if (params.deviceName) {
      query.deviceName = params.deviceName;
    }

    return (await this.collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(params.limit || 100)
      .skip(params.skip || 0)
      .toArray()) as SensorReading[];
  }

  async getLatestByDevice(deviceName: string): Promise<SensorReading | null> {
    if (!this.collection) throw new Error("Database not connected");

    return (await this.collection.findOne(
      { deviceName },
      { sort: { timestamp: -1 } },
    )) as SensorReading | null;
  }

  async getLatestTemperature(): Promise<number | undefined> {
    if (!this.collection) throw new Error("Database not connected");

    return (
      (
        await this.collection.findOne(
          {},
          {
            sort: { timestamp: -1 },
          },
        )
      )?.temperature ?? undefined
    );
  }

  async getDevices(): Promise<string[]> {
    if (!this.collection) throw new Error("Database not connected");

    return await this.collection.distinct("deviceName");
  }

  async getStats(deviceName?: string): Promise<any> {
    if (!this.collection) throw new Error("Database not connected");

    const match = deviceName ? { deviceName } : {};

    const stats = await this.collection
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: "$deviceName",
            count: { $sum: 1 },
            avgTemperature: { $avg: "$temperature" },
            avgHumidity: { $avg: "$humidity" },
            avgPressure: { $avg: "$pressure" },
            minTemperature: { $min: "$temperature" },
            maxTemperature: { $max: "$temperature" },
            latestReading: { $max: "$timestamp" },
            oldestReading: { $min: "$timestamp" },
          },
        },
      ])
      .toArray();

    return stats;
  }

  async getTotalCount(): Promise<number> {
    if (!this.collection) throw new Error("Database not connected");
    return await this.collection.countDocuments();
  }

  // Configuration management
  async getConfig(): Promise<{
    smartPlugIp: string;
    temperatureThreshold: number;
    humidityThreshold: number;
    interval: number;
  }> {
    if (!this.configCollection) throw new Error("Database not connected");

    const config = await this.configCollection.findOne({ _id: "settings" });
    return {
      smartPlugIp:
        config?.smartPlugIp || Deno.env.get("SMART_PLUG_IP") || "192.168.1.111",
      temperatureThreshold:
        config?.temperatureThreshold ||
        parseInt(Deno.env.get("TEMPERATURE_THRESHOLD") || "25"),
      humidityThreshold:
        config?.humidityThreshold ||
        parseInt(Deno.env.get("HUMIDITY_THRESHOLD") || "70"),
      interval:
        config?.interval ||
        parseInt(Deno.env.get("SMARTPLUG_INTERVAL") || "60"),
    };
  }

  async updateConfig(
    smartPlugIp: string,
    temperatureThreshold: number,
    humidityThreshold: number,
    interval: number,
  ): Promise<void> {
    if (!this.configCollection) throw new Error("Database not connected");

    await this.configCollection.updateOne(
      { _id: "settings" },
      {
        $set: {
          smartPlugIp,
          temperatureThreshold,
          humidityThreshold,
          interval,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
  async getLatestHumidity(): Promise<number | undefined> {
    if (!this.collection) throw new Error("Database not connected");

    return (
      (
        await this.collection.findOne(
          {},
          {
            sort: { timestamp: -1 },
          },
        )
      )?.humidity ?? undefined
    );
  }
}
