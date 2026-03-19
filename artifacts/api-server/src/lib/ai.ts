import OpenAI from "openai";

// ─────────────────────────────────────────────────────────────────────────────
// FREE MODELS — 26 verified live models on OpenRouter
// Ordered: fastest/most reliable first
// ─────────────────────────────────────────────────────────────────────────────
const FREE_MODELS = [
  "stepfun/step-3.5-flash:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "arcee-ai/trinity-mini:free",
  "z-ai/glm-4.5-air:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "liquid/lfm-2.5-1.2b-thinking:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-3n-e4b-it:free",
  "google/gemma-3n-e2b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "minimax/minimax-m2.5:free",
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3-27b-it:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "qwen/qwen3-coder:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "qwen/qwen3-4b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "arcee-ai/trinity-large-preview:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

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
// CLIENT
// ─────────────────────────────────────────────────────────────────────────────

export function getAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY_MISSING");
  return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Per-model hard timeout — OpenRouter sometimes queues silently instead of
// returning 429, so we force a switch after this many ms.
const MODEL_TIMEOUT_MS = 8_000;

function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fn(ctrl.signal).then(
    r => { clearTimeout(timer); return r; },
    e => { clearTimeout(timer); throw e; }
  );
}

function isAuthError(err: any): boolean {
  const s = err?.status ?? err?.statusCode ?? err?.response?.status;
  return s === 401 || s === 403;
}

function isUnavailable(err: any): boolean {
  const s = err?.status ?? err?.statusCode ?? err?.response?.status;
  const msg = String(err?.message ?? err?.error?.message ?? "").toLowerCase();
  return (
    s === 429 || s === 502 || s === 503 || s === 524 ||
    err?.name === "APIUserAbortError" ||
    msg.includes("rate limit") || msg.includes("too many") ||
    msg.includes("overloaded") || msg.includes("no providers") ||
    msg.includes("timed out") || msg.includes("unavailable") ||
    msg.includes("timeout")
  );
}

function buildModelList(preferredModel?: string, pool: string[] = FREE_MODELS): string[] {
  if (!preferredModel) return pool;
  return [preferredModel, ...pool.filter(m => m !== preferredModel)];
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE: try each model in turn with 8s timeout + pass full list to OpenRouter
// so OpenRouter can also switch server-side if a model stalls mid-stream.
// ─────────────────────────────────────────────────────────────────────────────

async function tryStream(
  client: OpenAI,
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "model">,
  models: string[]
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const stream = await withTimeout(
        (signal) =>
          client.chat.completions.create(
            {
              ...params,
              model,
              stream: true,
              // OpenRouter-specific: pass remaining models as server-side fallback
              // @ts-ignore
              models: models.slice(i),
            },
            { signal }
          ) as any,
        MODEL_TIMEOUT_MS
      );
      if (i > 0) console.log(`[OR] switched to ${model} (skipped ${i})`);
      return stream as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
    } catch (err: any) {
      if (isAuthError(err)) {
        throw new Error(
          "AI authentication failed. Your OPENROUTER_API_KEY is invalid or expired. Please update it on Render."
        );
      }
      const reason = isUnavailable(err)
        ? "busy/rate-limited"
        : `error (${err?.status ?? err?.name ?? "unknown"})`;
      console.warn(`[OR] ${model} ${reason} → trying next`);
    }
  }

  console.warn("[OR] All models tried. Pausing 3s then retrying top 5...");
  await sleep(3000);
  for (const model of models.slice(0, 5)) {
    try {
      const stream = await withTimeout(
        (signal) =>
          client.chat.completions.create(
            { ...params, model, stream: true, /* @ts-ignore */ models },
            { signal }
          ) as any,
        MODEL_TIMEOUT_MS
      );
      console.log(`[OR] retry succeeded: ${model}`);
      return stream as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
    } catch (_) {}
  }

  throw new Error(
    "AI is temporarily unavailable — all OpenRouter models are busy. Please try again in a few seconds."
  );
}

async function tryNonStream(
  client: OpenAI,
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  models: string[]
): Promise<OpenAI.Chat.ChatCompletion> {
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const result = await withTimeout(
        (signal) =>
          client.chat.completions.create(
            { ...params, model, /* @ts-ignore */ models: models.slice(i) },
            { signal }
          ) as any,
        MODEL_TIMEOUT_MS
      );
      if (i > 0) console.log(`[OR] switched to ${model} (skipped ${i})`);
      return result as OpenAI.Chat.ChatCompletion;
    } catch (err: any) {
      if (isAuthError(err)) {
        throw new Error(
          "AI authentication failed. Your OPENROUTER_API_KEY is invalid or expired. Please update it on Render."
        );
      }
      const reason = isUnavailable(err)
        ? "busy/rate-limited"
        : `error (${err?.status ?? err?.name ?? "unknown"})`;
      console.warn(`[OR] ${model} ${reason} → trying next`);
    }
  }

  await sleep(3000);
  for (const model of models.slice(0, 5)) {
    try {
      const result = await withTimeout(
        (signal) =>
          client.chat.completions.create(
            { ...params, model, /* @ts-ignore */ models },
            { signal }
          ) as any,
        MODEL_TIMEOUT_MS
      );
      return result as OpenAI.Chat.ChatCompletion;
    } catch (_) {}
  }

  throw new Error(
    "AI is temporarily unavailable — all OpenRouter models are busy. Please try again in a few seconds."
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function createChatCompletion(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  preferredModel?: string
): Promise<OpenAI.Chat.ChatCompletion> {
  let client: OpenAI;
  try { client = getAIClient(); } catch {
    throw new Error("AI service is not configured. OPENROUTER_API_KEY is missing on Render.");
  }
  const models = buildModelList(preferredModel ?? (params.model as string | undefined));
  return tryNonStream(client, params, models);
}

export async function createChatCompletionStream(
  params: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
  preferredModel?: string
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  let client: OpenAI;
  try { client = getAIClient(); } catch {
    throw new Error("AI service is not configured. OPENROUTER_API_KEY is missing on Render.");
  }
  const models = buildModelList(preferredModel ?? (params.model as string | undefined));
  return tryStream(client, params, models);
}

export async function createChatCompletionStreamFromList(
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "model">,
  modelList: string[]
): Promise<{ stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>; model: string }> {
  let client: OpenAI;
  try { client = getAIClient(); } catch {
    throw new Error("AI service is not configured. OPENROUTER_API_KEY is missing on Render.");
  }

  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    try {
      const stream = await withTimeout(
        (signal) =>
          client.chat.completions.create(
            { ...params, model, stream: true, /* @ts-ignore */ models: modelList.slice(i) },
            { signal }
          ) as any,
        MODEL_TIMEOUT_MS
      );
      if (i > 0) console.log(`[AI] switched to ${model} (skipped ${i})`);
      return { stream: stream as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>, model };
    } catch (err: any) {
      if (isAuthError(err)) {
        throw new Error(
          "AI authentication failed. Your OPENROUTER_API_KEY is invalid or expired. Please update it on Render."
        );
      }
      console.warn(`[agent] ${model} ${isUnavailable(err) ? "busy" : `error(${err?.status ?? err?.name})`} → next`);
    }
  }

  await sleep(3000);
  for (const model of modelList.slice(0, 3)) {
    try {
      const stream = await withTimeout(
        (signal) =>
          client.chat.completions.create(
            { ...params, model, stream: true, /* @ts-ignore */ models: modelList },
            { signal }
          ) as any,
        MODEL_TIMEOUT_MS
      );
      return { stream: stream as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>, model };
    } catch (_) {}
  }

  throw new Error(
    "AI is temporarily unavailable — all OpenRouter models are busy. Please try again in a few seconds."
  );
}
