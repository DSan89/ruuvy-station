/**
 * Logger service
 * Centralized logging with timestamps
 */

type LogLevel = "INFO" | "ERROR" | "WARN" | "DEBUG";

export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getTimestamp(): string {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${timestamp}] [${level}]`;

    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  info(message: string, data?: unknown): void {
    this.log("INFO", message, data);
  }

  error(message: string, data?: unknown): void {
    this.log("ERROR", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log("WARN", message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log("DEBUG", message, data);
  }
}
