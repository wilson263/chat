/**
 * Conversation Memory System for ZorvixAI
 *
 * Provides two layers of AI memory:
 *
 * 1. SHORT-TERM: Per-conversation running summary updated as the chat grows.
 *    Stored in the database (conversation_summaries table).
 *    Used to give the AI context about what was discussed without flooding
 *    the context window with hundreds of old messages.
 *
 * 2. LONG-TERM: Per-user key-value facts extracted by the AI over time.
 *    e.g. "preferred_language: TypeScript", "experience_level: senior".
 *    Stored in the ai_memory table. Injected as a system-prompt addendum.
 */

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { createChatCompletion } from "./ai";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConversationSummary {
  conversationId: number;
  summary: string;
  messageCount: number;
  updatedAt: Date;
}

export interface UserMemoryFact {
  key: string;
  value: string;
}

export interface MemoryContext {
  summary: string | null;
  facts: UserMemoryFact[];
}

// ── Short-Term: Conversation Summaries ───────────────────────────────────────

/**
 * Retrieves the stored summary for a conversation.
 */
export async function getConversationSummary(
  conversationId: number
): Promise<ConversationSummary | null> {
  try {
    const rows = await db.execute(
      sql`SELECT * FROM conversation_summaries WHERE conversation_id = ${conversationId} LIMIT 1`
    );
    if (!rows.rows || rows.rows.length === 0) return null;
    const row = rows.rows[0] as any;
    return {
      conversationId: row.conversation_id,
      summary: row.summary,
      messageCount: row.message_count,
      updatedAt: new Date(row.updated_at),
    };
  } catch {
    return null;
  }
}

/**
 * Generates a concise summary of a conversation history using the AI.
 * Focuses on: goals, decisions, code written, problems solved.
 */
export async function generateConversationSummary(
  history: Array<{ role: string; content: string }>,
  existingSummary?: string
): Promise<string> {
  const historyText = history
    .map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 800)}`)
    .join("\n\n");

  const prompt = existingSummary
    ? `You have a running summary of a conversation:\n\n${existingSummary}\n\nHere are the new messages since that summary:\n\n${historyText}\n\nUpdate the summary to include the new information. Keep it under 400 words. Focus on: what was built, decisions made, problems solved, code written.`
    : `Summarize this conversation in under 300 words. Focus on: what the user wanted to build, what was discussed, what code was written, any problems solved:\n\n${historyText}`;

  try {
    const result = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 600,
    });
    return result.choices[0]?.message?.content?.trim() ?? "Conversation in progress.";
  } catch {
    return existingSummary ?? "Conversation in progress.";
  }
}

/**
 * Saves or updates the conversation summary in the database.
 */
export async function saveConversationSummary(
  conversationId: number,
  summary: string,
  messageCount: number
): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO conversation_summaries (conversation_id, summary, message_count, updated_at)
      VALUES (${conversationId}, ${summary}, ${messageCount}, NOW())
      ON CONFLICT (conversation_id)
      DO UPDATE SET
        summary = EXCLUDED.summary,
        message_count = EXCLUDED.message_count,
        updated_at = NOW()
    `);
  } catch (err) {
    console.error("[memory] Failed to save conversation summary:", err);
  }
}

/**
 * Auto-summarizes a conversation when it grows past a threshold.
 * Called after each AI response in long conversations.
 */
export async function autoSummarizeIfNeeded(
  conversationId: number,
  history: Array<{ role: string; content: string }>,
  threshold: number = 20
): Promise<void> {
  if (history.length < threshold) return;

  try {
    const existing = await getConversationSummary(conversationId);
    if (existing && existing.messageCount >= history.length) return;

    const newHistory = existing
      ? history.slice(existing.messageCount)
      : history;

    const summary = await generateConversationSummary(newHistory, existing?.summary);
    await saveConversationSummary(conversationId, summary, history.length);
  } catch (err) {
    console.error("[memory] Auto-summarize error:", err);
  }
}

// ── Long-Term: User Memory Facts ─────────────────────────────────────────────

/**
 * Retrieves all stored memory facts for a user.
 */
export async function getUserMemory(userId: number): Promise<UserMemoryFact[]> {
  try {
    const rows = await db.execute(
      sql`SELECT key, value FROM ai_memory WHERE user_id = ${userId} ORDER BY updated_at DESC`
    );
    return (rows.rows ?? []).map((r: any) => ({ key: r.key, value: r.value }));
  } catch {
    return [];
  }
}

/**
 * Saves a memory fact for a user. Overwrites existing fact with the same key.
 */
export async function saveUserMemory(
  userId: number,
  key: string,
  value: string
): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO ai_memory (user_id, key, value, created_at, updated_at)
      VALUES (${userId}, ${key}, ${value}, NOW(), NOW())
      ON CONFLICT (user_id, key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `);
  } catch (err) {
    console.error("[memory] Failed to save user memory:", err);
  }
}

/**
 * Deletes a specific memory fact for a user.
 */
export async function deleteUserMemory(userId: number, key: string): Promise<void> {
  try {
    await db.execute(
      sql`DELETE FROM ai_memory WHERE user_id = ${userId} AND key = ${key}`
    );
  } catch (err) {
    console.error("[memory] Failed to delete user memory:", err);
  }
}

/**
 * Clears all memory for a user.
 */
export async function clearUserMemory(userId: number): Promise<void> {
  try {
    await db.execute(sql`DELETE FROM ai_memory WHERE user_id = ${userId}`);
  } catch (err) {
    console.error("[memory] Failed to clear user memory:", err);
  }
}

/**
 * Extracts learnable facts from a conversation turn using the AI.
 * Returns an array of {key, value} pairs to store in ai_memory.
 */
export async function extractMemoryFacts(
  userMessage: string,
  assistantResponse: string
): Promise<UserMemoryFact[]> {
  const prompt = `From this conversation snippet, extract any personal facts about the user that would be useful to remember for future conversations. Examples: preferred programming language, experience level, project they're working on, tech stack preferences, coding style preferences.

Return ONLY a JSON array like: [{"key": "preferred_language", "value": "TypeScript"}, ...]
Return [] if nothing worth remembering.

User: ${userMessage.slice(0, 500)}
Assistant: ${assistantResponse.slice(0, 300)}

JSON array:`;

  try {
    const result = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 300,
    });
    const raw = result.choices[0]?.message?.content?.trim() ?? "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (f: any) => typeof f.key === "string" && typeof f.value === "string" && f.key.length < 100 && f.value.length < 500
    );
  } catch {
    return [];
  }
}

/**
 * Builds the memory context to inject into the system prompt.
 * Combines conversation summary + user memory facts.
 */
export function buildMemoryContextString(ctx: MemoryContext): string {
  const parts: string[] = [];

  if (ctx.summary) {
    parts.push(`CONVERSATION SUMMARY:\n${ctx.summary}`);
  }

  if (ctx.facts.length > 0) {
    const factsStr = ctx.facts
      .map(f => `• ${f.key.replace(/_/g, " ")}: ${f.value}`)
      .join("\n");
    parts.push(`WHAT I KNOW ABOUT YOU:\n${factsStr}`);
  }

  return parts.length > 0
    ? `\n\n━━━ AI MEMORY ━━━\n${parts.join("\n\n")}\n━━━━━━━━━━━━━━━━`
    : "";
}

/**
 * Full memory context fetch: retrieves both summary and user facts.
 */
export async function getFullMemoryContext(
  conversationId: number | null,
  userId: number | null
): Promise<MemoryContext> {
  const [summaryResult, factsResult] = await Promise.allSettled([
    conversationId ? getConversationSummary(conversationId) : Promise.resolve(null),
    userId ? getUserMemory(userId) : Promise.resolve([]),
  ]);

  const summary = summaryResult.status === "fulfilled" ? summaryResult.value?.summary ?? null : null;
  const facts = factsResult.status === "fulfilled" ? factsResult.value : [];

  return { summary, facts };
}
