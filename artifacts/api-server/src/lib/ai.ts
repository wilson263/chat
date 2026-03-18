import OpenAI from "openai";

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder-480b-a35b:free",
  "openai/gpt-oss-120b:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "google/gemma-3-27b-it:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "deepseek/deepseek-r1:free",
  "deepseek/deepseek-v3-base:free",
  "openai/gpt-oss-20b:free",
  "qwen/qwen3-4b:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-3n-e4b-it:free",
  "google/gemma-3n-e2b-it:free",
  "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "arcee-ai/arcee-blitz:free",
  "stepfun/step-3.5-flash:free",
  "minimax/minimax-m2.5-1.5t:free",
  "liquid/lfm2.5-1.2b:free",
  "google/gemma-2-9b-it:free",
];

// Ordered fallback list for coding tasks — best coders first
const CODING_FALLBACKS = [
  "qwen/qwen3-coder-480b-a35b:free",
  "deepseek/deepseek-r1:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

export function getAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
}

export const FREE_MODEL = FREE_MODELS[0];
export const FREE_MODEL_FAST = CODING_FALLBACKS[0];

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

/**
 * Build the fallback model list for a given preferred model.
 * If the model is a coding model, we fall back within coding models first,
 * then the general pool — so we always stay with the best available model.
 */
function buildFallbackList(preferredModel?: string): string[] {
  if (!preferredModel) return FREE_MODELS;

  const isCodingModel = CODING_FALLBACKS.includes(preferredModel);

  if (isCodingModel) {
    // Start with the preferred, then the rest of the coding fallbacks, then general
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
