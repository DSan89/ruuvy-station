export class SmartPlugService {
  private plugState: boolean | undefined = undefined;
  constructor(
    private threshold: () => Promise<number>,
    private plugIp: () => Promise<string>,
    private getLatestTemperature: () => Promise<number | undefined>,
  ) {}

  async ifTemperatureIsOver(): Promise<boolean> {
    const temperature = await this.getLatestTemperature();
    console.log(
      `Latest temperature: ${temperature}°C, Threshold: ${await this.threshold()}°C`,
    );
    if (!temperature) {
      throw new Error("No temperature data available");
    }
    return temperature > (await this.threshold());
  }

  async turnOnPlug() {
    try {
      await fetch(`http://${await this.plugIp()}/relay/0?turn=on`);
      console.log("Plug turned ON");
    } catch (e) {
      console.error("Failed to turn on plug:", e);
    }
  }

  async turnOffPlug() {
    try {
      await fetch(`http://${await this.plugIp()}/relay/0?turn=off`);
      console.log("Plug turned OFF");
    } catch (e) {
      console.error("Failed to turn off plug:", e);
    }
  }

  async run() {
    if (await this.ifTemperatureIsOver()) {
      await this.turnOnPlug();
    } else {
      await this.turnOffPlug();
    }
  }
}
