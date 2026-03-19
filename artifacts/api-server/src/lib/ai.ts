import OpenAI from "openai";
  import Groq from "groq-sdk";

  // ─────────────────────────────────────────────────────────────────────────────
  // OPENROUTER FREE MODELS — ordered by reliability then quality
  // ─────────────────────────────────────────────────────────────────────────────
  const FREE_MODELS = [
    // Tier 1 — fastest & most reliably available
    "stepfun/step-3.5-flash:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
    "arcee-ai/arcee-blitz:free",
    "google/gemma-3-4b-it:free",
    "google/gemma-3n-e4b-it:free",
    "liquid/lfm2.5-1.2b:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    // Tier 2 — good quality, sometimes rate-limited
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free",
    "nvidia/llama-3.3-nemotron-super-49b-v1:free",
    "google/gemma-2-9b-it:free",
    "minimax/minimax-m2.5-1.5t:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "meta-llama/llama-3.2-1b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "microsoft/phi-3-medium-128k-instruct:free",
    "huggingfaceh4/zephyr-7b-beta:free",
    "openchat/openchat-7b:free",
    "undi95/toppy-m-7b:free",
    "gryphe/mythomist-7b:free",
    // Tier 3 — best quality but heavily rate-limited
    "qwen/qwen3-coder-480b-a35b:free",
    "deepseek/deepseek-r1:free",
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "deepseek/deepseek-v3-base:free",
    "qwen/qwen3-4b:free",
    "google/gemma-3n-e2b-it:free",
  ];

  // GROQ FREE MODELS — very fast, generous free tier, great reliability
  const GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "gemma-7b-it",
  ];

  export const CODING_FALLBACKS = [
    "qwen/qwen3-coder-480b-a35b:free",
    "deepseek/deepseek-r1:free",
    "openai/gpt-oss-120b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "nvidia/llama-3.3-nemotron-super-49b-v1:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "stepfun/step-3.5-flash:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
    "arcee-ai/arcee-blitz:free",
  ];

  export const AGENT_BUILD_MODELS = [
    "qwen/qwen3-coder-480b-a35b:free",
    "openai/gpt-oss-120b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "stepfun/step-3.5-flash:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "nvidia/llama-3.3-nemotron-super-49b-v1:free",
    "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
    "arcee-ai/arcee-blitz:free",
  ];

  export const PLANNING_MODELS = [
    "stepfun/step-3.5-flash:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
    "arcee-ai/arcee-blitz:free",
    "google/gemma-3-4b-it:free",
  ];

  export const FREE_MODEL = FREE_MODELS[0];
  export const FREE_MODEL_FAST = FREE_MODELS[0];

  // ─────────────────────────────────────────────────────────────────────────────
  // CLIENT FACTORIES
  // ─────────────────────────────────────────────────────────────────────────────

  export function getAIClient(): OpenAI {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is not set. Please add it in your Render environment variables at https://dashboard.render.com → your service → Environment."
      );
    }
    return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
  }

  function getGroqClient(): Groq | null {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    return new Groq({ apiKey });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function isAuthError(err: any): boolean {
    const status = err?.status ?? err?.response?.status;
    return status === 401 || status === 403;
  }

  function isRateLimit(err: any): boolean {
    const status = err?.status ?? err?.response?.status;
    const msg = String(err?.message ?? "").toLowerCase();
    return status === 429 || msg.includes("rate limit") || msg.includes("too many");
  }

  function isRetryableError(err: any): boolean {
    const status = err?.status ?? err?.response?.status;
    if ([429, 404, 400, 503, 502, 500].includes(status)) return true;
    const msg = String(err?.message ?? "").toLowerCase();
    return (
      msg.includes("no endpoints found") ||
      msg.includes("not a valid model") ||
      msg.includes("overloaded") ||
      msg.includes("unavailable") ||
      msg.includes("rate limit") ||
      msg.includes("context length") ||
      msg.includes("temporarily") ||
      msg.includes("capacity")
    );
  }

  function buildFallbackList(preferredModel?: string): string[] {
    if (!preferredModel) return FREE_MODELS;
    const isCodingModel = CODING_FALLBACKS.includes(preferredModel);
    if (isCodingModel) {
      const codingFallbacks = [preferredModel, ...CODING_FALLBACKS.filter(m => m !== preferredModel)];
      const generalFallbacks = FREE_MODELS.filter(m => !codingFallbacks.includes(m));
      return [...codingFallbacks, ...generalFallbacks];
    }
    return [preferredModel, ...FREE_MODELS.filter(m => m !== preferredModel)];
  }

  // Convert OpenAI-compatible messages to Groq format (same schema, just different SDK)
  function toGroqMessages(messages: OpenAI.Chat.ChatCompletionMessageParam[]): any[] {
    return messages.map(m => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GROQ FALLBACK — tries Groq models when ALL OpenRouter models fail
  // ─────────────────────────────────────────────────────────────────────────────

  async function tryGroqCompletion(
    params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
  ): Promise<OpenAI.Chat.ChatCompletion | null> {
    const groq = getGroqClient();
    if (!groq) return null;

    for (const model of GROQ_MODELS) {
      try {
        const response = await groq.chat.completions.create({
          model,
          messages: toGroqMessages(params.messages),
          max_tokens: params.max_tokens ?? 8192,
          temperature: (params.temperature as number) ?? 0.25,
        } as any);
        console.log(`[Groq fallback] Using model: ${model}`);
        return response as any;
      } catch (err: any) {
        if (isAuthError(err)) {
          console.warn(`[Groq] Auth error — check GROQ_API_KEY`);
          return null;
        }
        console.warn(`[Groq] ${model} failed (${err?.status}), trying next...`);
        if (isRateLimit(err)) await sleep(1000);
      }
    }
    return null;
  }

  async function tryGroqStream(
    params: OpenAI.Chat.ChatCompletionCreateParamsStreaming
  ): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk> | null> {
    const groq = getGroqClient();
    if (!groq) return null;

    for (const model of GROQ_MODELS) {
      try {
        const stream = await groq.chat.completions.create({
          model,
          messages: toGroqMessages(params.messages),
          max_tokens: params.max_tokens ?? 8192,
          temperature: (params.temperature as number) ?? 0.25,
          stream: true,
        } as any);
        console.log(`[Groq fallback] Streaming with model: ${model}`);
        return stream as any;
      } catch (err: any) {
        if (isAuthError(err)) {
          console.warn(`[Groq] Auth error — check GROQ_API_KEY`);
          return null;
        }
        console.warn(`[Groq] ${model} failed (${err?.status}), trying next...`);
        if (isRateLimit(err)) await sleep(1000);
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────

  export async function createChatCompletion(
    params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    preferredModel?: string
  ): Promise<OpenAI.Chat.ChatCompletion> {
    const modelsToTry = buildFallbackList(preferredModel ?? (params.model as string | undefined));
    let lastError: any;

    // Try OpenRouter models
    try {
      const client = getAIClient();
      for (let i = 0; i < modelsToTry.length; i++) {
        try {
          return await client.chat.completions.create({ ...params, model: modelsToTry[i] });
        } catch (err: any) {
          lastError = err;
          if (isAuthError(err)) {
            throw new Error(`OpenRouter authentication failed (${err?.status}). Please check your OPENROUTER_API_KEY in Render environment variables.`);
          }
          if (isRateLimit(err)) await sleep(500);
          if (i < modelsToTry.length - 1) {
            console.warn(`[OpenRouter] ${modelsToTry[i]} failed (${err?.status}), trying ${modelsToTry[i + 1]}...`);
          }
        }
      }
    } catch (err: any) {
      if (err.message.includes("OPENROUTER_API_KEY")) {
        console.warn("[AI] OPENROUTER_API_KEY not set, trying Groq fallback...");
      } else {
        lastError = err;
      }
    }

    // Groq fallback
    const groqResult = await tryGroqCompletion(params);
    if (groqResult) return groqResult;

    console.error("[AI] All providers failed. Last error:", lastError?.status, lastError?.message);
    throw new Error(
      "AI is temporarily unavailable — all providers are busy right now. Please try again in a few seconds."
    );
  }

  export async function createChatCompletionStream(
    params: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
    preferredModel?: string
  ): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
    const modelsToTry = buildFallbackList(preferredModel ?? (params.model as string | undefined));
    let lastError: any;

    // Try OpenRouter models
    try {
      const client = getAIClient();
      for (let i = 0; i < modelsToTry.length; i++) {
        try {
          return await client.chat.completions.create({ ...params, model: modelsToTry[i], stream: true });
        } catch (err: any) {
          lastError = err;
          if (isAuthError(err)) {
            throw new Error(`OpenRouter authentication failed (${err?.status}). Please check your OPENROUTER_API_KEY in Render environment variables.`);
          }
          if (isRateLimit(err)) await sleep(500);
          if (i < modelsToTry.length - 1) {
            console.warn(`[OpenRouter] ${modelsToTry[i]} failed (${err?.status}), trying ${modelsToTry[i + 1]}...`);
          }
        }
      }
    } catch (err: any) {
      if (!err.message.includes("OPENROUTER_API_KEY")) lastError = err;
    }

    // Groq fallback
    const groqStream = await tryGroqStream(params);
    if (groqStream) return groqStream;

    console.error("[AI] All providers failed. Last error:", lastError?.status, lastError?.message);
    throw new Error(
      "AI is temporarily unavailable — all providers are busy right now. Please try again in a few seconds."
    );
  }

  export async function createChatCompletionStreamFromList(
    params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "model">,
    modelList: string[]
  ): Promise<{ stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>; model: string }> {
    let lastError: any;

    // Try the given model list
    try {
      const client = getAIClient();
      for (let i = 0; i < modelList.length; i++) {
        try {
          const stream = await client.chat.completions.create({ ...params, model: modelList[i], stream: true });
          console.log(`[AI] Using model: ${modelList[i]}`);
          return { stream, model: modelList[i] };
        } catch (err: any) {
          lastError = err;
          if (isAuthError(err)) {
            throw new Error(`OpenRouter authentication failed. Please check your OPENROUTER_API_KEY.`);
          }
          if (isRateLimit(err)) await sleep(500);
          if (i < modelList.length - 1) {
            console.warn(`[agent] ${modelList[i]} unavailable (${err?.status}), trying ${modelList[i + 1]}...`);
          }
        }
      }
    } catch (err: any) {
      if (!err.message.includes("OPENROUTER_API_KEY")) lastError = err;
    }

    // Groq fallback
    const groqStream = await tryGroqStream(params as any);
    if (groqStream) return { stream: groqStream, model: "groq/llama-3.3-70b-versatile" };

    throw new Error(
      "AI is temporarily unavailable — all providers are busy right now. Please try again in a few seconds."
    );
  }
  