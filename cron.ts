Deno.cron("Process smart plug every 5 minutes", "*/5 * * * *", async () => {
  console.log("Processing smart plug state...");
  await fetch("http://127.0.0.1:33333/api/process")
    .then(() => {
      console.log("Called /process endpoint successfully");
    })
    .catch((e) => {
      console.error("Failed to call /process endpoint:", e);
    });
});
