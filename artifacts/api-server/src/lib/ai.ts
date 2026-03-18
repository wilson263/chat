import OpenAI from "openai";

// ── All available free models ─────────────────────────────────────────────────
// Ordered by: reliability (actually works), quality, speed.
// Models that are commonly rate-limited/unavailable are moved lower.
const FREE_MODELS = [
  // Tier 1 — Fast and reliably available on most accounts
  "stepfun/step-3.5-flash:free",            // Very fast, reliably available
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
  "arcee-ai/arcee-blitz:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-3n-e4b-it:free",
  "liquid/lfm2.5-1.2b:free",
  // Tier 2 — Good quality, sometimes rate-limited
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "google/gemma-2-9b-it:free",
  "minimax/minimax-m2.5-1.5t:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  // Tier 3 — High quality but heavily rate-limited on free tier
  "qwen/qwen3-coder-480b-a35b:free",
  "deepseek/deepseek-r1:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "deepseek/deepseek-v3-base:free",
  "qwen/qwen3-4b:free",
  "google/gemma-3n-e2b-it:free",
];

// For coding tasks: try best coders first, but include reliable fallbacks early
// so we don't waste time cycling through 10 failing models
const CODING_FALLBACKS = [
  // Try the best coders once each
  "qwen/qwen3-coder-480b-a35b:free",
  "deepseek/deepseek-r1:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  // If those fail, fall to fast reliable models
  "stepfun/step-3.5-flash:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
  "arcee-ai/arcee-blitz:free",
];

// For agent building specifically: skip slow rate-limited models, try fastest first
// This way if qwen3 is unavailable we don't spend 30s trying other failing models
export const AGENT_BUILD_MODELS = [
  "qwen/qwen3-coder-480b-a35b:free",          // Best coder — try first
  "openai/gpt-oss-120b:free",                  // Second best
  "meta-llama/llama-3.3-70b-instruct:free",    // Fast and capable
  "stepfun/step-3.5-flash:free",               // Very fast, reliably works — primary fallback
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
  "arcee-ai/arcee-blitz:free",
];

// For planning/analysis (speed matters more than code quality)
export const PLANNING_MODELS = [
  "stepfun/step-3.5-flash:free",               // Fastest and works
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
  "arcee-ai/arcee-blitz:free",
  "google/gemma-3-4b-it:free",
];

export function getAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
}

export const FREE_MODEL = FREE_MODELS[0];
export const FREE_MODEL_FAST = FREE_MODELS[0];

function isAuthError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  return status === 401 || status === 403;
}

function isRetryableError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  if (status === 429 || status === 404 || status === 400 || status === 503) return true;
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("no endpoints found") ||
    msg.includes("not a valid model") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("rate limit") ||
    msg.includes("context length")
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

export async function createChatCompletion(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  preferredModel?: string
): Promise<OpenAI.Chat.ChatCompletion> {
  const client = getAIClient();
  const modelsToTry = buildFallbackList(preferredModel ?? params.model as string | undefined);

  let lastError: any;
  for (let i = 0; i < modelsToTry.length; i++) {
    try {
      return await client.chat.completions.create({ ...params, model: modelsToTry[i] });
    } catch (err: any) {
      lastError = err;
      if (isAuthError(err)) {
        throw new Error(`OpenRouter authentication failed (${err?.status}). Please check your OPENROUTER_API_KEY.`);
      }
      if (isRetryableError(err) && i < modelsToTry.length - 1) {
        console.warn(`Model ${modelsToTry[i]} unavailable (${err?.status ?? "error"}), trying ${modelsToTry[i + 1]}...`);
        continue;
      }
      break;
    }
  }
  console.error("All models failed. Last error:", lastError?.status, lastError?.message);
  throw new Error("The AI service is temporarily unavailable. Please try again in a moment.");
}

export async function createChatCompletionStream(
  params: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
  preferredModel?: string
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  const client = getAIClient();
  const modelsToTry = buildFallbackList(preferredModel ?? params.model as string | undefined);

  let lastError: any;
  for (let i = 0; i < modelsToTry.length; i++) {
    try {
      return await client.chat.completions.create({ ...params, model: modelsToTry[i], stream: true });
    } catch (err: any) {
      lastError = err;
      if (isAuthError(err)) {
        throw new Error(`OpenRouter authentication failed (${err?.status}). Please check your OPENROUTER_API_KEY.`);
      }
      if (isRetryableError(err) && i < modelsToTry.length - 1) {
        console.warn(`Model ${modelsToTry[i]} unavailable (${err?.status ?? "error"}), trying ${modelsToTry[i + 1]}...`);
        continue;
      }
      break;
    }
  }
  console.error("All models failed. Last error:", lastError?.status, lastError?.message);
  throw new Error("The AI service is temporarily unavailable. Please try again in a moment.");
}

/**
 * Try a specific ordered list of models, stopping as soon as one works.
 * Use this for the agent builder where we control the priority list.
 */
export async function createChatCompletionStreamFromList(
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "model">,
  modelList: string[]
): Promise<{ stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>; model: string }> {
  const client = getAIClient();

  let lastError: any;
  for (let i = 0; i < modelList.length; i++) {
    try {
      const stream = await client.chat.completions.create({ ...params, model: modelList[i], stream: true });
      console.log(`Using model: ${modelList[i]}`);
      return { stream, model: modelList[i] };
    } catch (err: any) {
      lastError = err;
      if (isAuthError(err)) {
        throw new Error(`OpenRouter authentication failed. Please check your OPENROUTER_API_KEY.`);
      }
      if (isRetryableError(err) && i < modelList.length - 1) {
        console.warn(`[agent] ${modelList[i]} unavailable (${err?.status}), trying ${modelList[i + 1]}...`);
        continue;
      }
      break;
    }
  }
  throw new Error("No AI models available right now. Please try again in a moment.");
}
