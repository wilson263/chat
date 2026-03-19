/**
 * AI Memory API Routes for ZorvixAI
 *
 * Endpoints:
 *   GET    /api/memory              — Get all user memory facts
 *   POST   /api/memory              — Save a memory fact
 *   DELETE /api/memory/:key         — Delete a specific memory fact
 *   DELETE /api/memory              — Clear all memory
 *   GET    /api/memory/conversation/:id  — Get conversation summary
 *   POST   /api/memory/conversation/:id  — Trigger summary generation
 *   GET    /api/memory/context      — Full memory context (summary + facts)
 */

import { Router, type Request, type Response } from "express";
import {
  getUserMemory,
  saveUserMemory,
  deleteUserMemory,
  clearUserMemory,
  getConversationSummary,
  generateConversationSummary,
  saveConversationSummary,
  getFullMemoryContext,
  buildMemoryContextString,
  extractMemoryFacts,
} from "../lib/conversation-memory";
import { getUserId } from "./auth";

const router = Router();

// ── User Memory Facts ─────────────────────────────────────────────────────────

router.get("/api/memory", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const facts = await getUserMemory(userId);
    res.json({ facts, count: facts.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/memory", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { key, value } = req.body as { key?: string; value?: string };
  if (!key || !value) { res.status(400).json({ error: "key and value are required" }); return; }
  if (key.length > 100) { res.status(400).json({ error: "key must be under 100 characters" }); return; }
  if (value.length > 500) { res.status(400).json({ error: "value must be under 500 characters" }); return; }

  try {
    await saveUserMemory(userId, key, value);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/memory/:key", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { key } = req.params;
  try {
    await deleteUserMemory(userId, key);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/memory", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    await clearUserMemory(userId);
    res.json({ ok: true, message: "All memory cleared" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Conversation Summary ──────────────────────────────────────────────────────

router.get("/api/memory/conversation/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const conversationId = Number(req.params.id);
  if (isNaN(conversationId)) { res.status(400).json({ error: "Invalid conversation ID" }); return; }

  try {
    const summary = await getConversationSummary(conversationId);
    if (!summary) { res.status(404).json({ error: "No summary found for this conversation" }); return; }
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/memory/conversation/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const conversationId = Number(req.params.id);
  if (isNaN(conversationId)) { res.status(400).json({ error: "Invalid conversation ID" }); return; }

  const { history } = req.body as { history?: Array<{ role: string; content: string }> };
  if (!history || !Array.isArray(history) || history.length === 0) {
    res.status(400).json({ error: "history array is required" });
    return;
  }

  try {
    const existing = await getConversationSummary(conversationId);
    const summary = await generateConversationSummary(history, existing?.summary);
    await saveConversationSummary(conversationId, summary, history.length);
    res.json({ summary, messageCount: history.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Full Memory Context ───────────────────────────────────────────────────────

router.get("/api/memory/context", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const conversationId = req.query.conversationId ? Number(req.query.conversationId) : null;

  try {
    const ctx = await getFullMemoryContext(conversationId, userId);
    const contextString = buildMemoryContextString(ctx);
    res.json({ ...ctx, contextString });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Auto-extract facts from a conversation turn ───────────────────────────────

router.post("/api/memory/extract", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { userMessage, assistantResponse, save } = req.body as {
    userMessage: string;
    assistantResponse: string;
    save?: boolean;
  };

  if (!userMessage || !assistantResponse) {
    res.status(400).json({ error: "userMessage and assistantResponse are required" });
    return;
  }

  try {
    const facts = await extractMemoryFacts(userMessage, assistantResponse);

    if (save && facts.length > 0) {
      await Promise.all(facts.map(f => saveUserMemory(userId, f.key, f.value)));
    }

    res.json({ facts, saved: save ? facts.length : 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
