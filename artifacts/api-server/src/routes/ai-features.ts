import { Router } from "express";
import OpenAI from "openai";

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set.");
  return new OpenAI({ apiKey });
}

const openai = getOpenAIClient();

const router = Router();

router.post("/api/chat/auto-title", async (req, res) => {
  try {
    const { firstMessage } = req.body as { firstMessage: string };
    if (!firstMessage) return res.json({ title: "New Chat" });
    const result = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `Generate a short (3-6 words), descriptive title for a chat that starts with this message. Return ONLY the title, no quotes, no punctuation at end:\n\n"${firstMessage.slice(0, 200)}"`,
        },
      ],
      max_completion_tokens: 20,
    });
    const title = (result.choices[0]?.message?.content ?? "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .slice(0, 60) || "New Chat";
    res.json({ title });
  } catch {
    res.json({ title: "New Chat" });
  }
});

const sharedChats = new Map<string, { title: string; messages: any[]; createdAt: number }>();

router.post("/api/chat/share", (req, res) => {
  const { title, messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Invalid messages" });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sharedChats.set(id, { title: title || "Shared Chat", messages, createdAt: Date.now() });
  res.json({ shareId: id, url: `/shared/${id}` });
});

router.get("/api/chat/shared/:id", (req, res) => {
  const chat = sharedChats.get(req.params.id);
  if (!chat) return res.status(404).json({ error: "Shared chat not found" });
  res.json(chat);
});

router.post("/api/chat/websearch", async (req, res) => {
  try {
    const { query } = req.body as { query: string };
    if (!query) return res.status(400).json({ error: "Query required" });

    const result = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Answer the following question as accurately and comprehensively as possible. Note if any information might be outdated:\n\n${query}`,
        },
      ],
      max_completion_tokens: 2048,
    });
    const text = result.choices[0]?.message?.content ?? "";
    res.json({ answer: text, note: "Powered by Replit AI" });
  } catch (e: any) {
    res.status(500).json({ error: "Search failed: " + e.message });
  }
});

export default router;
