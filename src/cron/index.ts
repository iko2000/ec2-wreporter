//@ts-nocheck
import cron from "node-cron";
import runWeatherEmailReport = require("./jobs/weather-report");

const TZ = process.env.TZ || "Europe/Malta";

function scheduleJob(
  name: string,
  cronExpr: string,
  fn: () => Promise<void> | void,
  options?: cron.ScheduleOptions
) {
  let running = false;

  cron.schedule(
    cronExpr,
    async () => {
      if (running) {
        console.warn(`[${name}] Skipped (previous run still in progress)`);
        return;
      }

      const start = Date.now();
      running = true;
      console.log(`[${name}] Started at ${new Date().toISOString()}`);

      try {
        await fn();
        const ms = Date.now() - start;
        console.log(`[${name}] Finished in ${ms}ms`);
      } catch (err) {
        console.error(`[${name}] Failed:`, err);
      } finally {
        running = false;
      }
    },
    { timezone: TZ, ...options }
  );

  console.log(`[${name}] Scheduled "${cronExpr}" (TZ=${TZ})`);
}

scheduleJob("runweatherreport", "0 8,14 * * *", async () => {
  await runWeatherEmailReport();
});



function handleShutdown(signal: NodeJS.Signals) {
  console.log(`\nReceived ${signal}. Shutting down cron runner…`);
  // do any cleanup if needed
  process.exit(0);
}

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

console.log("✅ Cron runner started.");
