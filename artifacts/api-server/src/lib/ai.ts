import OpenAI from "openai";

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "deepseek/deepseek-r1:free",
  "deepseek/deepseek-v3-base:free",
  "google/gemma-2-9b-it:free",
];

export function getAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
}

export const FREE_MODEL = FREE_MODELS[0];
export const FREE_MODEL_FAST = FREE_MODELS[1];

function isRetryableError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  if (status === 429 || status === 404 || status === 400 || status === 503) return true;
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("no endpoints found") ||
    msg.includes("not a valid model") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable")
  );
}

export async function createChatCompletion(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  preferredModel?: string
): Promise<OpenAI.Chat.ChatCompletion> {
  const client = getAIClient();
  const modelsToTry = preferredModel
    ? [preferredModel, ...FREE_MODELS.filter((m) => m !== preferredModel)]
    : FREE_MODELS;

  let lastError: any;
  for (let i = 0; i < modelsToTry.length; i++) {
    try {
      return await client.chat.completions.create({ ...params, model: modelsToTry[i] });
    } catch (err: any) {
      lastError = err;
      if (isRetryableError(err) && i < modelsToTry.length - 1) {
        console.warn(`Model ${modelsToTry[i]} unavailable (${err?.status ?? "error"}), trying ${modelsToTry[i + 1]}...`);
        continue;
      }
      break;
    }
  }
  console.error("All models failed. Last error:", lastError?.message);
  throw new Error("The AI service is temporarily unavailable. Please try again in a moment.");
}

export async function createChatCompletionStream(
  params: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
  preferredModel?: string
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  const client = getAIClient();
  const modelsToTry = preferredModel
    ? [preferredModel, ...FREE_MODELS.filter((m) => m !== preferredModel)]
    : FREE_MODELS;

  let lastError: any;
  for (let i = 0; i < modelsToTry.length; i++) {
    try {
      return await client.chat.completions.create({ ...params, model: modelsToTry[i], stream: true });
    } catch (err: any) {
      lastError = err;
      if (isRetryableError(err) && i < modelsToTry.length - 1) {
        console.warn(`Model ${modelsToTry[i]} unavailable (${err?.status ?? "error"}), trying ${modelsToTry[i + 1]}...`);
        continue;
      }
      break;
    }
  }
  console.error("All models failed. Last error:", lastError?.message);
  throw new Error("The AI service is temporarily unavailable. Please try again in a moment.");
}
