/**
 * Sensor data processor
 * Handles Ruuvi sensor data processing and storage
 */

import { Buffer } from "node:buffer";
import {
  BLEPeripheral,
  RuuwiDecoded,
  SensorReading,
} from "../types/ruuvi.types.ts";
import { RuuviParser } from "../parsers/ruuvi-parser.ts";
import { DatabaseService } from "./database.service.ts";
import { Logger } from "./logger.ts";

export class SensorDataProcessor {
  private targetDeviceName = "Ruuvi C2A9";
  private database: DatabaseService;
  private logger = Logger.getInstance();

  constructor(database: DatabaseService) {
    this.database = database;
  }

  /**
   * Processes a BLE peripheral if it's a Ruuvi device
   */
  async processPeripheral(peripheral: BLEPeripheral): Promise<void> {
    if (!this.isRuuviDevice(peripheral)) {
      return;
    }

    try {
      const parsed = RuuviParser.parse(
        peripheral.advertisement.manufacturerData as unknown as Buffer,
      );
      await this.processSensorData(peripheral, parsed);
    } catch (error) {
      this.logger.error("Error processing sensor data:", error);
    }
  }

  /**
   * Checks if the peripheral is a Ruuvi device
   */
  private isRuuviDevice(peripheral: BLEPeripheral): boolean {
    return peripheral.advertisement.localName === this.targetDeviceName;
  }

  /**
   * Processes parsed sensor data
   */
  private async processSensorData(
    peripheral: BLEPeripheral,
    parsed: RuuwiDecoded,
  ): Promise<void> {
    this.logSensorData(peripheral.advertisement.localName, parsed);

    const sensorReading = this.buildSensorReading(peripheral, parsed);
    await this.database.saveSensorReading(sensorReading);
  }

  /**
   * Logs sensor data to console
   */
  private logSensorData(deviceName: string, data: RuuwiDecoded): void {
    this.logger.info(`****** New data from ${deviceName} *****`);
    this.logger.info(`Temperature: ${data.temperature}°C`);
    this.logger.info(`Humidity: ${data.humidity}%`);
    this.logger.info(`Pressure: ${data.pressure} Pa`);
    this.logger.info(`Acceleration X: ${data.accelerationX}`);
    this.logger.info(`Acceleration Y: ${data.accelerationY}`);
    this.logger.info(`Acceleration Z: ${data.accelerationZ}`);
    this.logger.info(`Movement Counter: ${data.movementCounter}`);
    this.logger.info(`Battery: ${data.battery} mV`);
    this.logger.info(`TX Power: ${data.txPower} dBm`);
    this.logger.info(`Measurement Sequence: ${data.measurementSequenceNumber}`);
    this.logger.info(`MAC: ${data.mac}`);
  }

  /**
   * Builds a sensor reading object from peripheral and parsed data
   */
  private buildSensorReading(
    peripheral: BLEPeripheral,
    parsed: RuuwiDecoded,
  ): SensorReading {
    return {
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
      rawData: peripheral.advertisement.manufacturerData as unknown as Buffer,
    };
  }
}
