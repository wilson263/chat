import OpenAI from "openai";

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-2-9b-it:free",
  "deepseek/deepseek-chat:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

export function getAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
}

export const FREE_MODEL = FREE_MODELS[0];
export const FREE_MODEL_FAST = FREE_MODELS[1];

function shouldRetry(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  if (status === 429 || status === 404 || status === 400) return true;
  const msg = err?.message ?? "";
  if (msg.includes("429") || msg.includes("No endpoints found") || msg.includes("not a valid model")) return true;
  return false;
}

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
      if (shouldRetry(err) && i < modelsToTry.length - 1) {
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
      if (shouldRetry(err) && i < modelsToTry.length - 1) {
        console.warn(`Model ${modelsToTry[i]} unavailable (${err?.status ?? "error"}), trying ${modelsToTry[i + 1]}...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All free models are currently unavailable. Please try again later.");
}
