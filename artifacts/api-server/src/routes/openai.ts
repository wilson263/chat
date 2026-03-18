import { Router, type IRouter } from "express";
  import { eq } from "drizzle-orm";
  import { db, conversations, messages } from "@workspace/db";
  import {
import { createChatCompletionStream } from "../lib/ai";
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
    const stream = await createChatCompletionStream({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [
        { role: "system", content: "You are an expert AI coding assistant. You can help with any programming language, framework, or technology. Provide clear, accurate, production-ready code with explanations." },
        ...chatMessages,
      ],
      max_tokens: 8192,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}

`);
      }
    }

    await db.insert(messages).values({ conversationId: convId, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}

`);
    res.end();
  });

  export default router;
  