/**
 * Ruuvi Station API
 * REST API for accessing sensor data using Oak framework
 */

import { Application, Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { SensorService } from "./services/sensor.service.ts";
import { SmartPlugService } from "./services/smartPlug.service.ts";
//import { EmailService } from "./services/email.service.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8000");
const MONGODB_URI =
  Deno.env.get("MONGODB_URI") ||
  "mongodb://admin:password123@mongodb:27017/ruuvi_station?authSource=admin";

const app = new Application();
const router = new Router();

// Initialize services
const sensorService = new SensorService(MONGODB_URI);
await sensorService.connect();

// Load initial config and initialize smart plug service
let config = await sensorService.getConfig();
let smartPlugService = new SmartPlugService(
  async () => (await sensorService.getConfig()).temperatureThreshold,
  async () => (await sensorService.getConfig()).smartPlugIp,
  () => sensorService.getLatestTemperature(),
);
//const emailService = new EmailService();

// Serve static files
router.get("/", async (ctx) => {
  ctx.response.body = await Deno.readTextFile("api/public/index.html");
  ctx.response.type = "text/html";
});

router.get("/api/process", async (ctx) => {
  try {
    console.log("Processing smart plug state based on latest temperature...");
    await smartPlugService.run();
    ctx.response.body = {
      success: true,
      message: "Smart plug state updated based on latest temperature.",
    };
  } catch (e) {
    console.error("Error processing smart plug state:", e);

    // Invia notifica email dell'errore
    /* await emailService.sendErrorAlert(
      "Smart Plug Processing Error",
      e instanceof Error ? e.message : String(e),
    ); */

    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to update smart plug state.",
    };
  }
});

// Health check
router.get("/health", async (ctx) => {
  const count = await sensorService.getTotalCount();
  ctx.response.body = {
    success: true,
    data: { status: "healthy", totalReadings: count, timestamp: Date.now() },
  };
});

// Get configuration
router.get("/api/config", async (ctx) => {
  try {
    const config = await sensorService.getConfig();
    ctx.response.body = { success: true, data: config };
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: error.message };
  }
});

// Update configuration
router.post("/api/config", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { smartPlugIp, temperatureThreshold } = body;

    if (!smartPlugIp || temperatureThreshold === undefined) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "smartPlugIp and temperatureThreshold required",
      };
      return;
    }

    await sensorService.updateConfig(smartPlugIp, temperatureThreshold);

    // Ricrea il servizio con le nuove configurazioni
    config = await sensorService.getConfig();
    smartPlugService = new SmartPlugService(
      async () => (await sensorService.getConfig()).temperatureThreshold,
      async () => (await sensorService.getConfig()).smartPlugIp,
      () => sensorService.getLatestTemperature(),
    );

    ctx.response.body = {
      success: true,
      message: "Configuration updated",
      data: config,
    };
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: error.message };
  }
});

// Get latest readings
router.get("/api/sensors/latest", async (ctx) => {
  const limit = parseInt(ctx.request.url.searchParams.get("limit") || "10");
  const data = await sensorService.getLatestReadings(limit);
  ctx.response.body = { success: true, data, count: data.length };
});

// Get readings by device
router.get("/api/sensors/device", async (ctx) => {
  const deviceName = ctx.request.url.searchParams.get("name");
  if (!deviceName) {
    ctx.response.status = 400;
    ctx.response.body = { success: false, error: "Device name required" };
    return;
  }
  const limit = parseInt(ctx.request.url.searchParams.get("limit") || "50");
  const data = await sensorService.getReadingsByDevice(deviceName, limit);
  ctx.response.body = { success: true, data, count: data.length };
});

// Get latest reading by device
router.get("/api/sensors/device/latest", async (ctx) => {
  const deviceName = ctx.request.url.searchParams.get("name");
  if (!deviceName) {
    ctx.response.status = 400;
    ctx.response.body = { success: false, error: "Device name required" };
    return;
  }
  const data = await sensorService.getLatestByDevice(deviceName);
  if (!data) {
    ctx.response.status = 404;
    ctx.response.body = { success: false, error: "No data found" };
    return;
  }
  ctx.response.body = { success: true, data };
});

// Get readings by time range
router.get("/api/sensors/range", async (ctx) => {
  const startTime = parseInt(ctx.request.url.searchParams.get("start") || "0");
  const endTime = parseInt(
    ctx.request.url.searchParams.get("end") || Date.now().toString(),
  );
  const deviceName = ctx.request.url.searchParams.get("device") || undefined;
  const limit = parseInt(ctx.request.url.searchParams.get("limit") || "100");
  const skip = parseInt(ctx.request.url.searchParams.get("skip") || "0");

  const data = await sensorService.getReadingsByTimeRange(startTime, endTime, {
    deviceName,
    limit,
    skip,
  });
  ctx.response.body = { success: true, data, count: data.length };
});

// Get all devices
router.get("/api/devices", async (ctx) => {
  const data = await sensorService.getDevices();
  ctx.response.body = { success: true, data, count: data.length };
});

// Get statistics
router.get("/api/stats", async (ctx) => {
  const deviceName = ctx.request.url.searchParams.get("device") || undefined;
  const data = await sensorService.getStats(deviceName);
  ctx.response.body = { success: true, data };
});

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    console.error("Error:", err);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: err.message };
  }
});

// CORS
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS",
  );
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  await next();
});

// Use router
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`🚀 Ruuvi Station API listening on http://localhost:${PORT}`);
console.log(`📊 Dashboard available at http://localhost:${PORT}`);

await app.listen({ port: PORT });
