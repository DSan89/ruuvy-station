/**
 * Ruuvi sensor data parser
 * Parses raw BLE manufacturer data from Ruuvi devices (format v5)
 */

import { Buffer } from "node:buffer";
import { RuuwiDecoded } from "../types/ruuvi.types.ts";
import { int2Hex, twosComplement } from "../utils/converters.ts";

export class RuuviParser {
  /**
   * Parses raw Ruuvi manufacturer data
   */
  static parse(data: Buffer): RuuwiDecoded {
    const parsed: Partial<RuuwiDecoded> = {};

    parsed.temperature = this.parseTemperature(data);
    parsed.humidity = this.parseHumidity(data);
    parsed.pressure = this.parsePressure(data);
    parsed.accelerationX = this.parseAccelerationX(data);
    parsed.accelerationY = this.parseAccelerationY(data);
    parsed.accelerationZ = this.parseAccelerationZ(data);

    const { battery, txPower } = this.parsePowerInfo(data);
    parsed.battery = battery;
    parsed.txPower = txPower;

    parsed.movementCounter = this.parseMovementCounter(data);
    parsed.measurementSequenceNumber =
      this.parseMeasurementSequenceNumber(data);
    parsed.mac = this.parseMac(data);
    parsed.dataFormat = 5;

    return parsed as RuuwiDecoded;
  }

  private static parseTemperature(data: Buffer): number {
    let temperature = (data[3] << 8) | (data[4] & 0xff);
    if (temperature > 32767) {
      temperature -= 65536;
    }
    return temperature / 200.0;
  }

  private static parseHumidity(data: Buffer): number {
    if (!(data[5] === 255 && data[6] === 255)) {
      return (((data[5] & 0xff) << 8) | (data[6] & 0xff)) / 400.0;
    }
    return 0;
  }

  private static parsePressure(data: Buffer): number {
    if (!(data[7] === 255 && data[8] === 255)) {
      return (((data[7] & 0xff) << 8) | (data[8] & 0xff)) + 50000;
    }
    return 0;
  }

  private static parseAccelerationX(data: Buffer): number {
    if (!(data[9] === 128 && data[10] === 0)) {
      let acceleration = (data[9] << 8) | (data[10] & 0xff);
      return twosComplement(acceleration);
    }
    return 0;
  }

  private static parseAccelerationY(data: Buffer): number {
    if (!(data[11] === 128 && data[12] === 0)) {
      let acceleration = (data[11] << 8) | (data[12] & 0xff);
      return twosComplement(acceleration);
    }
    return 0;
  }

  private static parseAccelerationZ(data: Buffer): number {
    if (!(data[13] === 128 && data[14] === 0)) {
      let acceleration = (data[13] << 8) | (data[14] & 0xff);
      return twosComplement(acceleration);
    }
    return 0;
  }

  private static parsePowerInfo(data: Buffer): {
    battery: number;
    txPower: number;
  } {
    const powerInfo = ((data[15] & 0xff) << 8) | (data[16] & 0xff);
    const battery = (powerInfo >>> 5) + 1600;
    const txPower = (powerInfo & 0b11111) * 2 - 40;
    return { battery, txPower };
  }

  private static parseMovementCounter(data: Buffer): number {
    return data[17] & 0xff;
  }

  private static parseMeasurementSequenceNumber(data: Buffer): number {
    return ((data[18] & 0xff) << 8) | (data[19] & 0xff);
  }

  private static parseMac(data: Buffer): string {
    return [
      int2Hex(data[20]),
      int2Hex(data[21]),
      int2Hex(data[22]),
      int2Hex(data[23]),
      int2Hex(data[24]),
      int2Hex(data[25]),
    ].join(":");
  }
}
