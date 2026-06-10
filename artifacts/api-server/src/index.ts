import { runMigrations } from "@workspace/db/migrate";
  import app from "./app";

  const rawPort = process.env["PORT"];

  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  async function start() {
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 3000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[startup] Running database migrations (attempt ${attempt}/${MAX_RETRIES})...`);
        await runMigrations();
        console.log("[startup] Migrations complete.");
        break;
      } catch (err) {
        console.error(`[startup] ❌ Migration attempt ${attempt} failed:`, err);
        if (attempt === MAX_RETRIES) {
          console.error("[startup] All migration attempts failed. Crashing so the process manager can restart.");
          process.exit(1);
        }
        console.log(`[startup] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    app.listen(port, () => {
      console.log(`[startup] ✅ Server listening on port ${port}`);
    });
  }

  start();
  