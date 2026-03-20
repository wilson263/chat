import OpenAI from "openai";

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY MODEL — stepfun/step-3.5-flash:free is the main AI.
// Reliable fallbacks tried in order if the primary is rate-limited.
// ─────────────────────────────────────────────────────────────────────────────
const FREE_MODELS = [
  "stepfun/step-3.5-flash:free",          // PRIMARY — always tried first
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "arcee-ai/trinity-mini:free",
  "qwen/qwen3-4b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

export const CODING_FALLBACKS = [
  "stepfun/step-3.5-flash:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "arcee-ai/trinity-mini:free",
];

export const AGENT_BUILD_MODELS = [
  "stepfun/step-3.5-flash:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "arcee-ai/trinity-mini:free",
  "nvidia/nemotron-nano-9b-v2:free",
];

export const PLANNING_MODELS = [
  "stepfun/step-3.5-flash:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-12b-it:free",
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

// Per-model hard timeout — give free models enough time to respond.
// stepfun/step-3.5-flash is fast but OpenRouter may queue briefly.
const MODEL_TIMEOUT_MS = 25_000;

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

// Callback fired whenever a model switch happens (busy → next model)
export type OnSwitchCallback = (fromModel: string, toModel: string, attempt: number, reason: string) => void;

// ─────────────────────────────────────────────────────────────────────────────
// CORE: try each model in turn with 8s timeout + pass full list to OpenRouter
// so OpenRouter can also switch server-side if a model stalls mid-stream.
// ─────────────────────────────────────────────────────────────────────────────

async function tryStream(
  client: OpenAI,
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "model">,
  models: string[],
  onSwitch?: OnSwitchCallback
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const stream = await withTimeout(
        (signal) =>
          client.chat.completions.create(
            { ...params, model, stream: true },
            { signal }
          ) as any,
        MODEL_TIMEOUT_MS
      );
      if (i > 0) console.log(`[OR] switched to ${model} (attempt ${i + 1})`);
      return stream as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
    } catch (err: any) {
      if (isAuthError(err)) {
        throw new Error(
          "AI authentication failed. Your OPENROUTER_API_KEY is invalid or expired. Please update it on Render."
        );
      }
      const status = err?.status ?? err?.statusCode ?? err?.response?.status ?? "?";
      const msg = String(err?.message ?? "").slice(0, 120);
      const reason = isUnavailable(err) ? "busy/rate-limited" : `error ${status}`;
      console.warn(`[OR] ${model} → ${reason} | ${msg}`);

      if (onSwitch && models[i + 1]) {
        try { onSwitch(model, models[i + 1], i + 1, reason); } catch (_) {}
      }
    }
  }

  // One final retry on the primary model after a brief pause
  console.warn("[OR] All models tried. Retrying primary model in 3s...");
  await sleep(3000);
  try {
    const stream = await withTimeout(
      (signal) =>
        client.chat.completions.create(
          { ...params, model: models[0], stream: true },
          { signal }
        ) as any,
      MODEL_TIMEOUT_MS
    );
    console.log(`[OR] final retry succeeded: ${models[0]}`);
    return stream as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
  } catch (err: any) {
    console.error(`[OR] final retry failed: ${err?.message}`);
  }

  throw new Error(
    "AI is temporarily unavailable. Please try again in a moment."
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
            { ...params, model },
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
      const status = err?.status ?? err?.statusCode ?? "?";
      const msg = String(err?.message ?? "").slice(0, 120);
      const reason = isUnavailable(err) ? "busy/rate-limited" : `error ${status}`;
      console.warn(`[OR] ${model} → ${reason} | ${msg}`);
    }
  }

  await sleep(3000);
  try {
    const result = await withTimeout(
      (signal) =>
        client.chat.completions.create(
          { ...params, model: models[0] },
          { signal }
        ) as any,
      MODEL_TIMEOUT_MS
    );
    return result as OpenAI.Chat.ChatCompletion;
  } catch (_) {}

  throw new Error(
    "AI is temporarily unavailable. Please try again in a moment."
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
  preferredModel?: string,
  onSwitch?: OnSwitchCallback
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  let client: OpenAI;
  try { client = getAIClient(); } catch {
    throw new Error("AI service is not configured. OPENROUTER_API_KEY is missing on Render.");
  }
  const models = buildModelList(preferredModel ?? (params.model as string | undefined));
  return tryStream(client, params, models, onSwitch);
}

export async function createChatCompletionStreamFromList(
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "model">,
  modelList: string[],
  onSwitch?: OnSwitchCallback
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
            { ...params, model, stream: true },
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
      const status = err?.status ?? err?.statusCode ?? "?";
      const msg = String(err?.message ?? "").slice(0, 120);
      const reason = isUnavailable(err) ? "busy" : `error ${status}`;
      console.warn(`[agent] ${model} → ${reason} | ${msg}`);
      if (onSwitch && modelList[i + 1]) {
        try { onSwitch(model, modelList[i + 1], i + 1, reason); } catch (_) {}
      }
    }
  }

  await sleep(3000);
  try {
    const stream = await withTimeout(
      (signal) =>
        client.chat.completions.create(
          { ...params, model: modelList[0], stream: true },
          { signal }
        ) as any,
      MODEL_TIMEOUT_MS
    );
    return { stream: stream as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>, model: modelList[0] };
  } catch (_) {}

  throw new Error(
    "AI is temporarily unavailable. Please try again in a moment."
  );
}
