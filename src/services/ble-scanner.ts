/**
 * BLE Scanner service
 * Handles Bluetooth Low Energy device scanning
 */

import noble from "@stoprocent/noble";
import { BLEPeripheral } from "../types/ruuvi.types.ts";
import { Logger } from "./logger.ts";

export type PeripheralDiscoveryHandler = (
  peripheral: BLEPeripheral,
) => Promise<void>;

export class BleScanner {
  private isScanning = false;
  private logger = Logger.getInstance();
  private discoveryHandlers: PeripheralDiscoveryHandler[] = [];

  constructor() {
    this.setupStateChangeListener();
    this.setupDiscoveryListener();
  }

  /**
   * Registers a handler to be called when a device is discovered
   */
  onDiscovery(handler: PeripheralDiscoveryHandler): void {
    this.discoveryHandlers.push(handler);
  }

  /**
   * Starts BLE scanning
   */
  async startScanning(): Promise<void> {
    try {
      this.isScanning = true;
      this.logger.info("Scanning for BLE devices...");
      await noble.startScanningAsync([], true);
    } catch (error) {
      this.logger.error("Error starting BLE scan:", error);
      this.isScanning = false;
    }
  }

  /**
   * Stops BLE scanning
   */
  async stopScanning(): Promise<void> {
    try {
      if (this.isScanning) {
        await noble.stopScanningAsync();
        this.isScanning = false;
        this.logger.info("Stopped BLE scanning");
      }
    } catch (error) {
      this.logger.error("Error stopping BLE scan:", error);
    }
  }

  /**
   * Checks if currently scanning
   */
  getIsScanning(): boolean {
    return this.isScanning;
  }

  private setupStateChangeListener(): void {
    noble.on("stateChange", async (state: string) => {
      if (state === "poweredOn") {
        await this.startScanning();
      } else {
        await this.stopScanning();
      }
    });
  }

  private setupDiscoveryListener(): void {
    noble.on("discover", async (peripheral: any) => {
      const blePeripheral: BLEPeripheral = {
        address: peripheral.address,
        advertisement: peripheral.advertisement,
        rssi: peripheral.rssi,
      };

      for (const handler of this.discoveryHandlers) {
        await handler(blePeripheral);
      }
    });
  }
}
