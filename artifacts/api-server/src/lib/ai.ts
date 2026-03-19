import OpenAI from "openai";
  import Groq from "groq-sdk";

  // ─────────────────────────────────────────────────────────────────────────────
  // FREE MODELS — verified live on OpenRouter as of latest check (26 total)
  // Ordered by: reliability first, then quality. Dead models removed.
  // ─────────────────────────────────────────────────────────────────────────────
  const FREE_MODELS = [
    // ── Tier 1: Fast & highly reliable ──────────────────────────────────────
    "stepfun/step-3.5-flash:free",                    // Very fast, always available
    "mistralai/mistral-small-3.1-24b-instruct:free",  // Rock-solid reliability
    "arcee-ai/trinity-mini:free",                     // Fast, 131k context
    "z-ai/glm-4.5-air:free",                         // Fast, 131k context
    "liquid/lfm-2.5-1.2b-instruct:free",             // Tiny but fast
    "liquid/lfm-2.5-1.2b-thinking:free",             // Thinking variant
    "google/gemma-3-4b-it:free",
    "google/gemma-3n-e4b-it:free",
    "google/gemma-3n-e2b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",

    // ── Tier 2: Good quality, large context ─────────────────────────────────
    "meta-llama/llama-3.3-70b-instruct:free",         // Powerful, 128k ctx
    "nvidia/nemotron-3-nano-30b-a3b:free",            // 256k context
    "nvidia/nemotron-nano-9b-v2:free",                // 128k context
    "nvidia/nemotron-nano-12b-v2-vl:free",            // Vision + text, 128k
    "minimax/minimax-m2.5:free",                      // 197k context
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    "google/gemma-3-12b-it:free",
    "google/gemma-3-27b-it:free",

    // ── Tier 3: Best quality — large models, sometimes rate-limited ─────────
    "openai/gpt-oss-120b:free",                       // Best general model
    "openai/gpt-oss-20b:free",
    "qwen/qwen3-coder:free",                          // Best coder, 262k ctx
    "qwen/qwen3-next-80b-a3b-instruct:free",          // 262k context
    "qwen/qwen3-4b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",         // 262k context, very capable
    "arcee-ai/trinity-large-preview:free",            // 131k context
    "nousresearch/hermes-3-llama-3.1-405b:free",      // Huge, high quality
  ];

  // ── Groq free models — very fast, generous rate limits, great fallback ───
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

  // ── Coding-first fallback list ────────────────────────────────────────────
  export const CODING_FALLBACKS = [
    "qwen/qwen3-coder:free",
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "stepfun/step-3.5-flash:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "arcee-ai/trinity-mini:free",
  ];

  // ── Agent builder models (skip slow rate-limited ones) ───────────────────
  export const AGENT_BUILD_MODELS = [
    "qwen/qwen3-coder:free",
    "openai/gpt-oss-120b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "stepfun/step-3.5-flash:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "arcee-ai/trinity-mini:free",
    "nvidia/nemotron-nano-9b-v2:free",
  ];

  // ── Planning/analysis (speed over code quality) ──────────────────────────
  export const PLANNING_MODELS = [
    "stepfun/step-3.5-flash:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "arcee-ai/trinity-mini:free",
    "z-ai/glm-4.5-air:free",
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
        "OPENROUTER_API_KEY is not set. Please add it in your Render environment variables."
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

  function toGroqMessages(messages: OpenAI.Chat.ChatCompletionMessageParam[]): any[] {
    return messages.map(m => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GROQ FALLBACK
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
          max_tokens: params.max_tokens ?? 100000,
          temperature: (params.temperature as number) ?? 0.25,
        } as any);
        console.log(`[Groq fallback] Using: ${model}`);
        return response as any;
      } catch (err: any) {
        if (isAuthError(err)) return null;
        console.warn(`[Groq] ${model} failed (${err?.status}), trying next...`);
        if (isRateLimit(err)) await sleep(500);
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
          max_tokens: params.max_tokens ?? 100000,
          temperature: (params.temperature as number) ?? 0.25,
          stream: true,
        } as any);
        console.log(`[Groq fallback] Streaming with: ${model}`);
        return stream as any;
      } catch (err: any) {
        if (isAuthError(err)) return null;
        console.warn(`[Groq] ${model} failed (${err?.status}), trying next...`);
        if (isRateLimit(err)) await sleep(500);
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
    try {
      const client = getAIClient();
      for (let i = 0; i < modelsToTry.length; i++) {
        try {
          return await client.chat.completions.create({ ...params, model: modelsToTry[i] });
        } catch (err: any) {
          lastError = err;
          if (isAuthError(err)) throw new Error(`OpenRouter auth failed (${err?.status}). Check OPENROUTER_API_KEY.`);
          if (isRateLimit(err)) await sleep(500);
          if (i < modelsToTry.length - 1) console.warn(`[OR] ${modelsToTry[i]} failed (${err?.status}), trying next...`);
        }
      }
    } catch (err: any) {
      if (!err.message?.includes("OPENROUTER_API_KEY")) lastError = err;
    }
    const groqResult = await tryGroqCompletion(params);
    if (groqResult) return groqResult;
    console.error("[AI] All providers failed. Last error:", lastError?.status, lastError?.message);
    throw new Error("AI is temporarily unavailable — all providers are busy. Please try again in a few seconds.");
  }

  export async function createChatCompletionStream(
    params: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
    preferredModel?: string
  ): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
    const modelsToTry = buildFallbackList(preferredModel ?? (params.model as string | undefined));
    let lastError: any;
    try {
      const client = getAIClient();
      for (let i = 0; i < modelsToTry.length; i++) {
        try {
          return await client.chat.completions.create({ ...params, model: modelsToTry[i], stream: true });
        } catch (err: any) {
          lastError = err;
          if (isAuthError(err)) throw new Error(`OpenRouter auth failed (${err?.status}). Check OPENROUTER_API_KEY.`);
          if (isRateLimit(err)) await sleep(500);
          if (i < modelsToTry.length - 1) console.warn(`[OR] ${modelsToTry[i]} failed (${err?.status}), trying next...`);
        }
      }
    } catch (err: any) {
      if (!err.message?.includes("OPENROUTER_API_KEY")) lastError = err;
    }
    const groqStream = await tryGroqStream(params);
    if (groqStream) return groqStream;
    console.error("[AI] All providers failed. Last error:", lastError?.status, lastError?.message);
    throw new Error("AI is temporarily unavailable — all providers are busy. Please try again in a few seconds.");
  }

  export async function createChatCompletionStreamFromList(
    params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "model">,
    modelList: string[]
  ): Promise<{ stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>; model: string }> {
    let lastError: any;
    try {
      const client = getAIClient();
      for (let i = 0; i < modelList.length; i++) {
        try {
          const stream = await client.chat.completions.create({ ...params, model: modelList[i], stream: true });
          console.log(`[AI] Using model: ${modelList[i]}`);
          return { stream, model: modelList[i] };
        } catch (err: any) {
          lastError = err;
          if (isAuthError(err)) throw new Error(`OpenRouter auth failed. Check OPENROUTER_API_KEY.`);
          if (isRateLimit(err)) await sleep(500);
          if (i < modelList.length - 1) console.warn(`[agent] ${modelList[i]} failed (${err?.status}), trying next...`);
        }
      }
    } catch (err: any) {
      if (!err.message?.includes("OPENROUTER_API_KEY")) lastError = err;
    }
    const groqStream = await tryGroqStream(params as any);
    if (groqStream) return { stream: groqStream, model: "groq/llama-3.3-70b-versatile" };
    throw new Error("AI is temporarily unavailable — all providers are busy. Please try again in a few seconds.");
  }
  