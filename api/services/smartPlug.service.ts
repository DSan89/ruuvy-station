export class SmartPlugService {
  private plugState: boolean | undefined = undefined;
  constructor(
    private temperatureThreshold: () => Promise<number>,
    private humidityThreshold: () => Promise<number>,
    private plugIp: () => Promise<string>,
    private getLatestTemperature: () => Promise<number | undefined>,
    private getLatestHumidity: () => Promise<number | undefined>,
  ) {}

  async ifTemperatureIsOver(): Promise<boolean> {
    const temperature = await this.getLatestTemperature();
    console.log(
      `Latest temperature: ${temperature}°C, Threshold: ${await this.temperatureThreshold()}°C}%`,
    );
    if (temperature === undefined) {
      throw new Error("No temperature data available");
    }
    // Logica custom da implementare
    return temperature > (await this.temperatureThreshold());
  }

  async ifHumidityIsOver(): Promise<boolean> {
    const humidity = await this.getLatestHumidity();
    console.log(
      `Latest humidity: ${humidity}%, Humidity Threshold: ${await this.humidityThreshold()}%`,
    );
    if (humidity === undefined) {
      throw new Error("No humidity data available");
    }
    // Logica custom da implementare
    return humidity > (await this.humidityThreshold());
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
    if ((await this.ifTemperatureIsOver()) || (await this.ifHumidityIsOver())) {
      await this.turnOnPlug();
    } else {
      await this.turnOffPlug();
    }
  }
}
