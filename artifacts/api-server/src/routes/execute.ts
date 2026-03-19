import { Router, type Request, type Response } from "express";

const router = Router();

const PISTON_API = "https://emkc.org/api/v2/piston";

let cachedRuntimes: any[] | null = null;
let runtimesCachedAt = 0;

async function getRuntimes() {
  const now = Date.now();
  if (cachedRuntimes && now - runtimesCachedAt < 60 * 60 * 1000) return cachedRuntimes;
  const res = await fetch(`${PISTON_API}/runtimes`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error("Failed to fetch runtimes");
  cachedRuntimes = await res.json();
  runtimesCachedAt = now;
  return cachedRuntimes;
}

router.get("/execute/runtimes", async (_req: Request, res: Response): Promise<void> => {
  try {
    const runtimes = await getRuntimes();
    res.json({ runtimes });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to fetch runtimes" });
  }
});

router.post("/execute", async (req: Request, res: Response): Promise<void> => {
  const { language, version = "*", code, stdin = "", args = [] } = req.body;

  if (!language || typeof language !== "string") {
    res.status(400).json({ error: "language is required" });
    return;
  }
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "code is required" });
    return;
  }
  if (code.length > 100_000) {
    res.status(400).json({ error: "Code too large (max 100KB)" });
    return;
  }

  const startTime = Date.now();

  try {
    const payload = {
      language,
      version,
      files: [{ content: code }],
      stdin,
      args,
      compile_timeout: 30000,
      run_timeout: 10000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    };

    const pistonRes = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });

    if (!pistonRes.ok) {
      const errText = await pistonRes.text();
      res.status(pistonRes.status).json({ error: errText || "Execution failed" });
      return;
    }

    const result = await pistonRes.json();
    const elapsed = Date.now() - startTime;

    res.json({
      language: result.language,
      version: result.version,
      run: result.run,
      compile: result.compile,
      elapsed,
    });
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      res.status(408).json({ error: "Execution timed out (45s limit)" });
      return;
    }
    res.status(500).json({ error: err.message ?? "Execution failed" });
  }
});

export default router;
