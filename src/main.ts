/**
 * Main application entry point
 * Orchestrates all services
 */

import { BleScanner } from "./services/ble-scanner.ts";
import { DatabaseService } from "./services/database.service.ts";
import { SensorDataProcessor } from "./services/sensor-processor.ts";
import { Logger } from "./services/logger.ts";
import { CONFIG } from "./config/constants.ts";

class Application {
  private bleScanner: BleScanner;
  private database: DatabaseService;
  private sensorProcessor: SensorDataProcessor;
  private logger = Logger.getInstance();

  constructor() {
    this.database = new DatabaseService(CONFIG.MONGODB_URI);
    this.bleScanner = new BleScanner();
    this.sensorProcessor = new SensorDataProcessor(this.database);
  }

  /**
   * Initializes and starts the application
   */
  async start(): Promise<void> {
    try {
      this.logger.info("Starting Ruuvi Station application...");

      // Connect to database
      const connected = await this.database.connect();
      if (!connected) {
        this.logger.error("Failed to connect to database. Exiting.");
        return;
      }

      // Setup BLE discovery handler
      this.bleScanner.onDiscovery(async (peripheral) => {
        this.logger.info("Discovered BLE device");
        await this.sensorProcessor.processPeripheral(peripheral);
      });

      this.logger.info("Application started successfully");
    } catch (error) {
      this.logger.error("Error starting application:", error);
      await this.stop();
    }
  }

  /**
   * Stops the application
   */
  async stop(): Promise<void> {
    this.logger.info("Stopping application...");
    await this.bleScanner.stopScanning();
    await this.database.disconnect();
    this.logger.info("Application stopped");
  }
}

// Start application
const app = new Application();
await app.start();

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await app.stop();
  process.exit(0);
});
