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
  try {
    console.log("[startup] Running database migrations...");
    await runMigrations();
    console.log("[startup] Migrations complete.");
  } catch (err) {
    // Log the full error so Render logs show exactly what went wrong
    console.error("[startup] ❌ Migration error (server will still start):", err);
  }

  app.listen(port, () => {
    console.log(`[startup] ✅ Server listening on port ${port}`);
  });
}

start();
