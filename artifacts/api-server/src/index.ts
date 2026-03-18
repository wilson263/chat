process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exit(1);
});

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

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Render's proxy can drop long-running SSE connections (e.g. large AI code builds
// that stream for 3–5 minutes). Raise the Node.js server timeouts so the server
// side never closes the connection first. Render's own limit is ~10 minutes.
server.keepAliveTimeout = 600000;  // 10 minutes
server.headersTimeout  = 605000;  // slightly above keepAliveTimeout
