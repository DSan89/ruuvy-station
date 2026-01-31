/**
 * Type definitions for Ruuvi sensor data
 */

import { Buffer } from "node:buffer";

export type RuuwiDecoded = {
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

export type SensorReading = {
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
  rawData: Buffer;
};

export interface BLEPeripheral {
  address: string;
  advertisement: {
    localName: string;
    manufacturerData: Buffer;
  };
  rssi: number;
}
