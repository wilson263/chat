import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
  GetOpenaiConversationResponse,
  ListOpenaiConversationsResponse,
  ListOpenaiMessagesResponse,
} from "@workspace/api-zod";
import OpenAI from "openai";

  function getAIClient(): OpenAI {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not set.");
    return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
  }

  const groq = getAIClient();
  const stream = await groq.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [
      { role: "system", content: "You are an expert AI coding assistant. You can help with any programming language, framework, or technology. Provide clear, accurate, production-ready code with explanations." },
      ...chatMessages,
    ],
    stream: true,
    max_tokens: 8192,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  await db.insert(messages).values({ conversationId: convId, role: "assistant", content: fullResponse });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
