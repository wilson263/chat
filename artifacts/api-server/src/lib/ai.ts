import OpenAI from "openai";

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
// CLIENT FACTORY
// ─────────────────────────────────────────────────────────────────────────────

export function getAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY_MISSING");
  }
  return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
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

function isServerError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  return status >= 500 && status < 600;
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

// ─────────────────────────────────────────────────────────────────────────────
// CORE: try every model with smart retry, OpenRouter only
// ─────────────────────────────────────────────────────────────────────────────

async function tryModelsNonStream(
  client: OpenAI,
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  modelsToTry: string[]
): Promise<OpenAI.Chat.ChatCompletion> {
  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const result = await client.chat.completions.create({ ...params, model });
      if (i > 0) console.log(`[OR] Succeeded with model: ${model} (after ${i} skipped)`);
      return result;
    } catch (err: any) {
      if (isAuthError(err)) {
        throw new Error(
          "AI authentication failed. Your OPENROUTER_API_KEY is invalid or expired. Please update it in the Render dashboard."
        );
      }
      if (isRateLimit(err)) {
        // Rate limited — instantly move to next model, no waiting
        console.warn(`[OR] ${model} busy (429), switching to next model instantly...`);
      } else if (isServerError(err)) {
        // Server error — instantly move to next model
        console.warn(`[OR] ${model} server error (${err?.status}), switching to next model...`);
      } else {
        console.warn(`[OR] ${model} failed (${err?.status ?? "unknown"}), switching to next model...`);
      }
    }
  }

  // All 26 models tried — wait 3 seconds then retry the top 5 models once more
  console.warn("[OR] All models busy. Waiting 3s then retrying top 5 models...");
  await sleep(3000);
  for (const model of modelsToTry.slice(0, 5)) {
    try {
      const result = await client.chat.completions.create({ ...params, model });
      console.log(`[OR] Retry succeeded with: ${model}`);
      return result;
    } catch (_) {
      // continue
    }
  }

  throw new Error(
    "AI is temporarily unavailable — all OpenRouter models are busy. Please try again in a few seconds."
  );
}

async function tryModelsStream(
  client: OpenAI,
  params: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
  modelsToTry: string[]
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const stream = await client.chat.completions.create({ ...params, model, stream: true });
      if (i > 0) console.log(`[OR] Streaming with model: ${model} (after ${i} skipped)`);
      return stream;
    } catch (err: any) {
      if (isAuthError(err)) {
        throw new Error(
          "AI authentication failed. Your OPENROUTER_API_KEY is invalid or expired. Please update it in the Render dashboard."
        );
      }
      if (isRateLimit(err)) {
        // Rate limited — instantly move to next model, no waiting
        console.warn(`[OR] ${model} busy (429), switching to next model instantly...`);
      } else if (isServerError(err)) {
        // Server error — instantly move to next model
        console.warn(`[OR] ${model} server error (${err?.status}), switching to next model...`);
      } else {
        console.warn(`[OR] ${model} failed (${err?.status ?? "unknown"}), switching to next model...`);
      }
    }
  }

  // All 26 models tried — wait 3 seconds then retry the top 5 models once more
  console.warn("[OR] All models busy. Waiting 3s then retrying top 5 models...");
  await sleep(3000);
  for (const model of modelsToTry.slice(0, 5)) {
    try {
      const stream = await client.chat.completions.create({ ...params, model, stream: true });
      console.log(`[OR] Retry succeeded with: ${model}`);
      return stream;
    } catch (_) {
      // continue
    }
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
  const modelsToTry = buildFallbackList(preferredModel ?? (params.model as string | undefined));
  let client: OpenAI;
  try {
    client = getAIClient();
  } catch {
    throw new Error(
      "AI service is not configured. The OPENROUTER_API_KEY environment variable is missing on Render."
    );
  }
  return tryModelsNonStream(client, params, modelsToTry);
}

export async function createChatCompletionStream(
  params: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
  preferredModel?: string
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  const modelsToTry = buildFallbackList(preferredModel ?? (params.model as string | undefined));
  let client: OpenAI;
  try {
    client = getAIClient();
  } catch {
    throw new Error(
      "AI service is not configured. The OPENROUTER_API_KEY environment variable is missing on Render."
    );
  }
  return tryModelsStream(client, params, modelsToTry);
}

export async function createChatCompletionStreamFromList(
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "model">,
  modelList: string[]
): Promise<{ stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>; model: string }> {
  let client: OpenAI;
  try {
    client = getAIClient();
  } catch {
    throw new Error(
      "AI service is not configured. The OPENROUTER_API_KEY environment variable is missing on Render."
    );
  }

  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    try {
      const stream = await client.chat.completions.create({ ...params, model, stream: true });
      if (i > 0) console.log(`[AI] Using model: ${model} (after ${i} skipped)`);
      return { stream, model };
    } catch (err: any) {
      if (isAuthError(err)) {
        throw new Error(
          "AI authentication failed. Your OPENROUTER_API_KEY is invalid or expired. Please update it in the Render dashboard."
        );
      }
      if (isRateLimit(err)) {
        // Rate limited — instantly switch to next model, no waiting
        console.warn(`[agent] ${model} busy (429), switching to next model instantly...`);
      } else if (isServerError(err)) {
        console.warn(`[agent] ${model} server error (${err?.status}), switching to next model...`);
      } else {
        console.warn(`[agent] ${model} failed (${err?.status ?? "unknown"}), switching to next model...`);
      }
    }
  }

  // All models tried — wait 3s then retry top 3
  console.warn("[agent] All models busy. Waiting 3s then retrying top 3...");
  await sleep(3000);
  for (const model of modelList.slice(0, 3)) {
    try {
      const stream = await client.chat.completions.create({ ...params, model, stream: true });
      console.log(`[agent] Retry succeeded with: ${model}`);
      return { stream, model };
    } catch (_) {}
  }

  throw new Error(
    "AI is temporarily unavailable — all OpenRouter models are busy. Please try again in a few seconds."
  );
}
