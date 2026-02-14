Deno.cron("Log a message", "* * * * *", async () => {
  console.log("This will print once a minute.");
  await fetch("http://localhost:8000/api/process")
    .then(() => {
      console.log("Called /process endpoint successfully");
    })
    .catch((e) => {
      console.error("Failed to call /process endpoint:", e);
    });
});
