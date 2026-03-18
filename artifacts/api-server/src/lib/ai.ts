import OpenAI from "openai";

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-2-9b-it:free",
  "deepseek/deepseek-r1:free",
  "qwen/qwen2.5-72b-instruct:free",
];

export function getAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
}

export const FREE_MODEL = FREE_MODELS[0];
export const FREE_MODEL_FAST = FREE_MODELS[1];

export async function createChatCompletion(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  preferredModel?: string
): Promise<OpenAI.Chat.ChatCompletion> {
  const client = getAIClient();
  const modelsToTry = preferredModel
    ? [preferredModel, ...FREE_MODELS.filter((m) => m !== preferredModel)]
    : FREE_MODELS;

  for (let i = 0; i < modelsToTry.length; i++) {
    try {
      return await client.chat.completions.create({ ...params, model: modelsToTry[i] });
    } catch (err: any) {
      const shouldRetry = err?.status === 429 || err?.status === 404 ||
        err?.message?.includes("429") || err?.message?.includes("No endpoints found");
      if (shouldRetry && i < modelsToTry.length - 1) {
        console.warn(`Model ${modelsToTry[i]} unavailable (${err?.status ?? "error"}), trying ${modelsToTry[i + 1]}...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All free models are currently unavailable. Please try again later.");
}

export async function createChatCompletionStream(
  params: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
  preferredModel?: string
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
  const client = getAIClient();
  const modelsToTry = preferredModel
    ? [preferredModel, ...FREE_MODELS.filter((m) => m !== preferredModel)]
    : FREE_MODELS;

  for (let i = 0; i < modelsToTry.length; i++) {
    try {
      return await client.chat.completions.create({ ...params, model: modelsToTry[i], stream: true });
    } catch (err: any) {
      const shouldRetry = err?.status === 429 || err?.status === 404 ||
        err?.message?.includes("429") || err?.message?.includes("No endpoints found");
      if (shouldRetry && i < modelsToTry.length - 1) {
        console.warn(`Model ${modelsToTry[i]} unavailable (${err?.status ?? "error"}), trying ${modelsToTry[i + 1]}...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All free models are currently unavailable. Please try again later.");
}
