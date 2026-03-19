/**
 * Smart Context Manager for ZorvixAI
 *
 * Manages conversation context windows intelligently:
 * - Tracks approximate token usage
 * - Compresses older messages to fit model limits
 * - Prioritizes system prompts and recent exchanges
 * - Detects code-heavy conversations and adjusts limits
 */

export interface ContextMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ContextStats {
  messageCount: number;
  estimatedTokens: number;
  wasCompressed: boolean;
  compressionRatio: number;
}

/** Rough token estimate: ~4 chars per token (conservative for code) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

/** Check if the message content is heavily code-based */
function isCodeHeavy(content: string): boolean {
  const codeBlockCount = (content.match(/```/g) ?? []).length;
  const codeLineRatio = (content.match(/^\s{2,}|\t/gm) ?? []).length / Math.max(1, content.split("\n").length);
  return codeBlockCount >= 2 || codeLineRatio > 0.4;
}

/** Extract key facts from a message for compression */
function extractKeyFacts(messages: ContextMessage[]): string {
  const userMessages = messages.filter(m => m.role === "user").map(m => m.content.slice(0, 200));
  const topics = userMessages.join(" | ");
  return `[Previous context summary: User discussed — ${topics.slice(0, 500)}]`;
}

/**
 * Trims a conversation history to fit within a target token budget.
 * Strategy:
 *   1. Always keep the system prompt (if any).
 *   2. Always keep the last N exchanges (configurable).
 *   3. For middle messages, replace with a summary placeholder.
 */
export function trimContextToTokenBudget(
  messages: ContextMessage[],
  maxTokens: number = 24000,
  keepLastExchanges: number = 6
): { messages: ContextMessage[]; stats: ContextStats } {
  const originalCount = messages.length;
  let totalTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  if (totalTokens <= maxTokens) {
    return {
      messages,
      stats: {
        messageCount: originalCount,
        estimatedTokens: totalTokens,
        wasCompressed: false,
        compressionRatio: 1,
      },
    };
  }

  // Separate system messages from conversation
  const systemMessages = messages.filter(m => m.role === "system");
  const conversationMessages = messages.filter(m => m.role !== "system");

  // Always keep the last N exchanges (user + assistant pairs)
  const keepCount = Math.min(keepLastExchanges * 2, conversationMessages.length);
  const recentMessages = conversationMessages.slice(-keepCount);
  const olderMessages = conversationMessages.slice(0, conversationMessages.length - keepCount);

  // Build summary of older messages if any
  const compressed: ContextMessage[] = [...systemMessages];

  if (olderMessages.length > 0) {
    const summary = extractKeyFacts(olderMessages);
    compressed.push({ role: "system", content: summary });
  }

  compressed.push(...recentMessages);

  const newTokens = compressed.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  return {
    messages: compressed,
    stats: {
      messageCount: compressed.length,
      estimatedTokens: newTokens,
      wasCompressed: true,
      compressionRatio: newTokens / totalTokens,
    },
  };
}

/**
 * Builds an optimized message array for the AI call, handling:
 * - Long system prompts
 * - Code-heavy messages (tighter budgets)
 * - Message priority ordering
 */
export function buildOptimizedContext(
  systemPrompt: string,
  history: ContextMessage[],
  userMessage: string,
  options: {
    maxTokens?: number;
    modelContextWindow?: number;
    preserveCodeBlocks?: boolean;
  } = {}
): { messages: ContextMessage[]; stats: ContextStats } {
  const {
    maxTokens = 28000,
    modelContextWindow = 32000,
    preserveCodeBlocks = true,
  } = options;

  const codeHeavy = isCodeHeavy(userMessage) || history.some(m => isCodeHeavy(m.content));
  const effectiveMax = codeHeavy ? Math.min(maxTokens, modelContextWindow * 0.6) : maxTokens;

  const allMessages: ContextMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  return trimContextToTokenBudget(allMessages, effectiveMax, codeHeavy ? 4 : 8);
}

/**
 * Splits a very long user message into chunks if it exceeds the single-message limit.
 * Returns them as a sequence to be sent with context.
 */
export function chunkLongMessage(
  content: string,
  chunkSize: number = 8000
): string[] {
  if (content.length <= chunkSize) return [content];

  const chunks: string[] = [];
  let offset = 0;

  while (offset < content.length) {
    // Try to break at a natural boundary (newline, period, space)
    let end = Math.min(offset + chunkSize, content.length);
    if (end < content.length) {
      const breakAt = content.lastIndexOf("\n", end);
      if (breakAt > offset + chunkSize * 0.5) end = breakAt + 1;
    }
    chunks.push(content.slice(offset, end));
    offset = end;
  }

  return chunks;
}

/**
 * Merges duplicate consecutive messages of the same role.
 * Prevents issues with some models that reject back-to-back same-role messages.
 */
export function mergeConsecutiveSameRole(messages: ContextMessage[]): ContextMessage[] {
  const merged: ContextMessage[] = [];

  for (const msg of messages) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role && msg.role !== "system") {
      last.content += "\n\n" + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  return merged;
}

/**
 * Detects the programming language from a code block or file content.
 * Used to tailor AI responses and model selection.
 */
export function detectLanguageFromContent(content: string): string {
  const fenceMatch = content.match(/```(\w+)/);
  if (fenceMatch) return fenceMatch[1].toLowerCase();

  const patterns: [RegExp, string][] = [
    [/\bimport\s+React\b|\bfrom\s+'react'/, "tsx"],
    [/\bconst\s+\w+\s*=\s*require\(/, "javascript"],
    [/\bdef\s+\w+\(.*\):\s*$|\bimport\s+\w+\s*$|\bprint\(/, "python"],
    [/\bpackage\s+\w+\s*;\s*\bimport\s+java\./, "java"],
    [/\bpub\s+fn\s+|\buse\s+std::/, "rust"],
    [/\bfunc\s+\w+\(.*\)\s*(->|\{)/, "go"],
    [/\#include\s*<\w+>|\bint\s+main\(/, "c"],
    [/<!DOCTYPE html>|<html|<body/, "html"],
    [/\bbody\s*\{|\bmargin:\s*0|\bflex:\s*1/, "css"],
    [/^\s*\{[\s\S]*"[\w]+"\s*:/, "json"],
    [/^---\n|^- name:/, "yaml"],
    [/SELECT|INSERT|UPDATE|DELETE|CREATE TABLE/i, "sql"],
    [/\binterface\s+\w+\s*\{|\btype\s+\w+\s*=/, "typescript"],
  ];

  for (const [regex, lang] of patterns) {
    if (regex.test(content)) return lang;
  }

  return "unknown";
}

/**
 * Calculates a similarity score between two strings using character n-grams.
 * Useful for deduplicating nearly-identical messages in history.
 */
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return 0;

  const ngrams = (s: string, n: number): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i <= s.length - n; i++) set.add(s.slice(i, i + n));
    return set;
  };

  const aN = ngrams(a.toLowerCase(), 3);
  const bN = ngrams(b.toLowerCase(), 3);
  const intersection = [...aN].filter(g => bN.has(g)).length;
  const union = new Set([...aN, ...bN]).size;

  return union === 0 ? 0 : intersection / union;
}

/**
 * Removes near-duplicate messages from history to reduce context bloat.
 * Keeps the most recent version of near-duplicate content.
 */
export function deduplicateHistory(
  messages: ContextMessage[],
  similarityThreshold: number = 0.85
): ContextMessage[] {
  const result: ContextMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const current = messages[i];
    let isDuplicate = false;

    for (let j = i + 1; j < messages.length; j++) {
      if (messages[j].role === current.role) {
        const sim = calculateSimilarity(current.content, messages[j].content);
        if (sim >= similarityThreshold) {
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) result.push(current);
  }

  return result;
}
