import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface Attachment {
  name: string;
  type: "image" | "text";
  mimeType: string;
  data: string;
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  userMessage: string;
  history?: HistoryMessage[];
  attachments?: Attachment[];
  context?: string;
  model?: string;
  openaiApiKey?: string;
  temperature?: number;
  systemPrompt?: string;
}

const GROQ_MODELS: Record<string, string> = {
  "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile": "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant": "llama-3.1-8b-instant",
  "mixtral-8x7b-32768": "mixtral-8x7b-32768",
  "gemma2-9b-it": "gemma2-9b-it",
};

const OPENAI_MODELS = new Set(["gpt-4o", "gpt-4o-mini", "o1-mini"]);

const BASE_SYSTEM_PROMPT = `You are ZorvixAI, an intelligent AI assistant. You are helpful, knowledgeable, and can both answer questions and build software.

BEHAVIOR RULES:
- For general questions, greetings, facts, explanations, or anything conversational — answer in plain, clear text. Do NOT write code.
- For requests to build, create, make, generate, code, or develop an app/website/script — output complete working code with filenames clearly labeled.

WHEN WRITING CODE:
- Generate ALL files needed for the project.
- Code must be complete and production-ready.
- After generating code, give a brief 2-3 line summary.
- Support any language: JS, TS, Python, Java, Go, Rust, PHP, Ruby, etc.

EXAMPLES:
- "Who invented the telephone?" → Answer in plain text: "Alexander Graham Bell invented the telephone in 1876."
- "What is React?" → Explain in plain text.
- "Build me a todo app in React" → Write complete code.
- "Create a Python web scraper" → Write complete code.

Be direct and helpful. Match the response format to the type of question.`;

async function streamGroq(
  res: any,
  model: string,
  userMessage: string,
  history: HistoryMessage[],
  attachments: Attachment[],
  context?: string,
  temperature?: number,
  systemPrompt?: string
) {
  const textAttachments = attachments.filter(a => a.type === "text");

  let fullText = "";
  if (context) fullText += `Current code context:\n${context}\n\n`;
  for (const att of textAttachments) {
    fullText += `--- Uploaded file: ${att.name} ---\n${att.data}\n\n`;
  }
  fullText += userMessage;

  const finalSystemPrompt = systemPrompt
    ? `${BASE_SYSTEM_PROMPT}\n\nAdditional user instructions:\n${systemPrompt}`
    : BASE_SYSTEM_PROMPT;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: finalSystemPrompt },
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: fullText },
  ];

  const { groq } = await import("@workspace/integrations-groq-ai");
  const stream = await groq.chat.completions.create({
    model,
    messages,
    stream: true,
    max_tokens: 16384,
    temperature: typeof temperature === "number" ? temperature : 0.7,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
}

async function streamOpenAI(
  res: any,
  model: string,
  userMessage: string,
  history: HistoryMessage[],
  attachments: Attachment[],
  apiKey: string,
  context?: string,
  temperature?: number,
  systemPrompt?: string
) {
  const textAttachments = attachments.filter(a => a.type === "text");
  const imageAttachments = attachments.filter(a => a.type === "image");

  let userContent = "";
  if (context) userContent += `Current code context:\n${context}\n\n`;
  for (const att of textAttachments) {
    userContent += `--- Uploaded file: ${att.name} ---\n${att.data}\n\n`;
  }
  userContent += userMessage;

  const finalSystemPrompt = systemPrompt
    ? `${BASE_SYSTEM_PROMPT}\n\nAdditional user instructions:\n${systemPrompt}`
    : BASE_SYSTEM_PROMPT;

  type OpenAIContent = string | { type: string; text?: string; image_url?: { url: string } }[];
  const openaiMessages: { role: string; content: OpenAIContent }[] = [
    { role: "system", content: finalSystemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
  ];

  if (imageAttachments.length > 0) {
    const parts: { type: string; text?: string; image_url?: { url: string } }[] = [
      { type: "text", text: userContent },
    ];
    for (const img of imageAttachments) {
      parts.push({ type: "image_url", image_url: { url: img.data } });
    }
    openaiMessages.push({ role: "user", content: parts });
  } else {
    openaiMessages.push({ role: "user", content: userContent });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      stream: true,
      max_tokens: 16384,
      temperature: typeof temperature === "number" ? temperature : 0.7,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

  const body = response.body;
  if (!body) throw new Error("No response body");

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const dataStr = line.slice(6).trim();
      if (dataStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      } catch {}
    }
  }
}

router.post("/chat/message", async (req, res): Promise<void> => {
  const body = req.body as ChatRequest;
  if (!body || typeof body.userMessage !== "string") {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }

  const { userMessage, history = [], attachments = [], context, model, openaiApiKey, temperature, systemPrompt } = body;
  const isOpenAI = OPENAI_MODELS.has(model ?? "");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    if (isOpenAI) {
      if (!openaiApiKey) {
        res.write(`data: ${JSON.stringify({ content: "⚠️ OpenAI API key is required for GPT models. Add it in Settings → API Keys." })}\n\n`);
      } else {
        await streamOpenAI(res, model!, userMessage, history, attachments, openaiApiKey, context, temperature, systemPrompt);
      }
    } else {
      const resolvedModel = GROQ_MODELS[model ?? ""] ?? "llama-3.3-70b-versatile";
      await streamGroq(res, resolvedModel, userMessage, history, attachments, context, temperature, systemPrompt);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ content: `\n\nError: ${err.message}` })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

router.post("/chat/generate-image", async (_req, res): Promise<void> => {
  res.status(501).json({ error: "Image generation is not supported with the Groq AI provider." });
});

export default router;
