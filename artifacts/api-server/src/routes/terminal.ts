import { Router, type Request, type Response } from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { getUserId } from "./auth";

const router = Router();

const LANG_CONFIG: Record<string, { ext: string; cmd: string; args: (f: string) => string[] }> = {
  javascript: { ext: "js", cmd: "node", args: (f) => [f] },
  typescript: { ext: "ts", cmd: "npx", args: (f) => ["--yes", "tsx", f] },
  python: { ext: "py", cmd: "python3", args: (f) => [f] },
  bash: { ext: "sh", cmd: "bash", args: (f) => [f] },
  html: { ext: "html", cmd: "cat", args: (f) => [f] },
  ruby: { ext: "rb", cmd: "ruby", args: (f) => [f] },
};

router.post("/terminal/exec", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { code, language = "javascript" } = req.body;
  if (!code || typeof code !== "string") { res.status(400).json({ error: "code is required" }); return; }

  const config = LANG_CONFIG[language];
  if (!config) { res.status(400).json({ error: `Unsupported language: ${language}. Supported: ${Object.keys(LANG_CONFIG).join(", ")}` }); return; }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "exec-"));
  const tmpFile = path.join(tmpDir, `main.${config.ext}`);

  try {
    await fs.writeFile(tmpFile, code, "utf-8");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const proc = spawn(config.cmd, config.args(tmpFile), {
      timeout: 30000,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
      cwd: tmpDir,
    });

    const writeChunk = (type: string, text: string) => {
      res.write(`data: ${JSON.stringify({ type, text })}\n\n`);
    };

    proc.stdout.on("data", (d: Buffer) => writeChunk("stdout", d.toString()));
    proc.stderr.on("data", (d: Buffer) => writeChunk("stderr", d.toString()));

    proc.on("close", (code) => {
      res.write(`data: ${JSON.stringify({ type: "exit", code, done: true })}\n\n`);
      res.end();
      fs.rm(tmpDir, { recursive: true }).catch(() => {});
    });

    proc.on("error", (err) => {
      writeChunk("error", err.message);
      res.write(`data: ${JSON.stringify({ type: "exit", code: 1, done: true })}\n\n`);
      res.end();
      fs.rm(tmpDir, { recursive: true }).catch(() => {});
    });

    req.on("close", () => { proc.kill(); fs.rm(tmpDir, { recursive: true }).catch(() => {}); });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    fs.rm(tmpDir, { recursive: true }).catch(() => {});
  }
});

export default router;
