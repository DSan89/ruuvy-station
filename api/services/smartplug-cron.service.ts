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

  private start() {
    this.clear();
    this.intervalId = setInterval(async () => {
      try {
        await this.smartPlugService.run();
        console.log("[Periodic] SmartPlugService.run() eseguito");
      } catch (e) {
        console.error("[Periodic] Errore SmartPlugService:", e);
      }
    }, this.interval * 1000);
  }

  updateInterval(newInterval: number) {
    if (this.interval !== newInterval) {
      this.interval = newInterval;
      this.start();
    }
  }

  clear() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
