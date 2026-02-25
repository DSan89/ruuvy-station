import { SmartPlugService } from "./smartPlug.service.ts";

export class SmartPlugCronService {
  private intervalId: number | undefined;
  private interval: number;
  private smartPlugService: SmartPlugService;

  constructor(smartPlugService: SmartPlugService, interval: number = 60) {
    this.smartPlugService = smartPlugService;
    this.interval = interval;
    this.start();
  }
  private async process() {
    try {
      await this.smartPlugService.run();
      console.log("[Periodic] SmartPlugService.run() eseguito");
    } catch (e) {
      console.error("[Periodic] Errore SmartPlugService:", e);
    }
  }

  private async start() {
    this.clear();
    await this.process();
    this.intervalId = setInterval(async () => {
      await this.process();
    }, this.interval * 1000);
  }

  async updateInterval(newInterval: number) {
    if (this.interval !== newInterval) {
      this.interval = newInterval;
      await this.start();
    }
  }

  clear() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
