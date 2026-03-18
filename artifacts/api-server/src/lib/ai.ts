import OpenAI from "openai";

  // Free models in priority order - if one is overloaded, tries the next
  const FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
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
        const is429 = err?.status === 429 || err?.message?.includes("429");
        if (is429 && i < modelsToTry.length - 1) {
          console.warn(`Model ${modelsToTry[i]} returned 429, trying ${modelsToTry[i + 1]}...`);
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
        const is429 = err?.status === 429 || err?.message?.includes("429");
        if (is429 && i < modelsToTry.length - 1) {
          console.warn(`Model ${modelsToTry[i]} returned 429, trying ${modelsToTry[i + 1]}...`);
          continue;
        }
        throw err;
      }
    }
    throw new Error("All free models are currently unavailable. Please try again later.");
  }
  