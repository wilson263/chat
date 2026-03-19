/**
 * Intelligent AI Response Cache for ZorvixAI
 *
 * Caches AI responses to:
 * - Reduce API calls for repeated/similar requests
 * - Improve response times dramatically
 * - Track model performance and cost
 * - Enable intelligent cache warming
 *
 * Uses a tiered strategy:
 * 1. Exact match cache (fastest)
 * 2. Semantic similarity cache (fuzzy matching)
 * 3. Template-based caching for structured queries
 */

import crypto from "crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CacheEntry {
  key: string;
  prompt: string;
  response: string;
  model: string;
  tokens: number;
  createdAt: number;
  hits: number;
  lastHit: number;
  ttl: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  avgResponseTokens: number;
  oldestEntry: number;
  newestEntry: number;
  memorySizeBytes: number;
}

export interface CacheConfig {
  maxEntries?: number;
  defaultTTL?: number;
  enableSemanticMatch?: boolean;
  semanticSimilarityThreshold?: number;
}

// ── Cache Implementation ──────────────────────────────────────────────────────

export class AIResponseCache {
  private cache = new Map<string, CacheEntry>();
  private stats = { hits: 0, misses: 0 };
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 500,
      defaultTTL: config.defaultTTL ?? 30 * 60 * 1000, // 30 minutes
      enableSemanticMatch: config.enableSemanticMatch ?? true,
      semanticSimilarityThreshold: config.semanticSimilarityThreshold ?? 0.92,
    };

    // Run cleanup every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // ── Cache Key Generation ──────────────────────────────────────────────────

  /**
   * Generates a deterministic cache key from prompt + model + options.
   * Normalizes whitespace to catch near-identical queries.
   */
  private generateKey(prompt: string, model: string, options: Record<string, unknown> = {}): string {
    const normalized = prompt.trim().replace(/\s+/g, " ").toLowerCase();
    const payload = JSON.stringify({ prompt: normalized, model, options });
    return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
  }

  /**
   * Normalizes a prompt for comparison (removes extra whitespace, lowercases).
   */
  private normalizeForComparison(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "");
  }

  // ── Semantic Similarity ───────────────────────────────────────────────────

  /**
   * Computes a fast character n-gram Jaccard similarity between two strings.
   * Returns a value between 0 (no match) and 1 (identical).
   */
  private computeSimilarity(a: string, b: string): number {
    const na = this.normalizeForComparison(a);
    const nb = this.normalizeForComparison(b);

    if (na === nb) return 1;
    if (na.length < 10 || nb.length < 10) return na === nb ? 1 : 0;

    const ngrams = (s: string, n: number): Set<string> => {
      const grams = new Set<string>();
      for (let i = 0; i <= s.length - n; i++) grams.add(s.slice(i, i + n));
      return grams;
    };

    const aN = ngrams(na, 4);
    const bN = ngrams(nb, 4);
    const intersection = [...aN].filter(g => bN.has(g)).length;
    const union = new Set([...aN, ...bN]).size;

    return union === 0 ? 0 : intersection / union;
  }

  // ── Get / Set ─────────────────────────────────────────────────────────────

  /**
   * Attempts to get a cached response for the given prompt.
   * Checks exact match first, then semantic similarity.
   */
  get(prompt: string, model: string, options: Record<string, unknown> = {}): string | null {
    const key = this.generateKey(prompt, model, options);

    // Exact match
    const exact = this.cache.get(key);
    if (exact) {
      if (Date.now() > exact.createdAt + exact.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }
      exact.hits++;
      exact.lastHit = Date.now();
      this.stats.hits++;
      return exact.response;
    }

    // Semantic match
    if (this.config.enableSemanticMatch) {
      for (const entry of this.cache.values()) {
        if (entry.model !== model) continue;
        if (Date.now() > entry.createdAt + entry.ttl) continue;

        const similarity = this.computeSimilarity(prompt, entry.prompt);
        if (similarity >= this.config.semanticSimilarityThreshold) {
          entry.hits++;
          entry.lastHit = Date.now();
          this.stats.hits++;
          return entry.response;
        }
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Stores a response in the cache.
   * Evicts the least-recently-used entry if the cache is full.
   */
  set(
    prompt: string,
    model: string,
    response: string,
    options: { tokenCount?: number; ttl?: number; cacheKey?: Record<string, unknown> } = {}
  ): void {
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    const key = this.generateKey(prompt, model, options.cacheKey ?? {});

    this.cache.set(key, {
      key,
      prompt,
      response,
      model,
      tokens: options.tokenCount ?? Math.ceil(response.length / 4),
      createdAt: Date.now(),
      hits: 0,
      lastHit: Date.now(),
      ttl: options.ttl ?? this.config.defaultTTL,
    });
  }

  /**
   * Removes the least-recently-used entry from the cache.
   */
  private evictLRU(): void {
    let oldest: CacheEntry | null = null;
    for (const entry of this.cache.values()) {
      if (!oldest || entry.lastHit < oldest.lastHit) oldest = entry;
    }
    if (oldest) this.cache.delete(oldest.key);
  }

  // ── Cache Management ──────────────────────────────────────────────────────

  /**
   * Removes all expired entries from the cache.
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.createdAt + entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Clears all cache entries.
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Invalidates all entries that match a given prompt pattern.
   */
  invalidateByPattern(pattern: RegExp): number {
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(entry.prompt)) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }

  // ── Stats & Introspection ─────────────────────────────────────────────────

  getStats(): CacheStats {
    const entries = [...this.cache.values()];
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    const totalRequests = this.stats.hits + this.stats.misses;

    return {
      totalEntries: entries.length,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      avgResponseTokens: entries.length > 0
        ? entries.reduce((sum, e) => sum + e.tokens, 0) / entries.length
        : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.createdAt)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.createdAt)) : 0,
      memorySizeBytes: entries.reduce((sum, e) => sum + e.prompt.length + e.response.length, 0),
    };
  }

  /**
   * Returns the top N most frequently hit cache entries.
   */
  getTopEntries(n: number = 10): CacheEntry[] {
    return [...this.cache.values()]
      .sort((a, b) => b.hits - a.hits)
      .slice(0, n);
  }

  get size(): number {
    return this.cache.size;
  }
}

// ── Global Cache Instance ─────────────────────────────────────────────────────

export const globalAICache = new AIResponseCache({
  maxEntries: 500,
  defaultTTL: 30 * 60 * 1000,
  enableSemanticMatch: true,
  semanticSimilarityThreshold: 0.93,
});

// ── Cache-Aware AI Call Wrapper ───────────────────────────────────────────────

import { createChatCompletion, createChatCompletionStream } from "./ai";
import type OpenAI from "openai";

/**
 * Wraps createChatCompletion with cache checking.
 * Cache is keyed on the user message content + model.
 * Streams bypass the cache (too complex to cache).
 */
export async function cachedChatCompletion(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  options: {
    cacheEnabled?: boolean;
    cacheTTL?: number;
    cacheBypassCondition?: (prompt: string) => boolean;
  } = {}
): Promise<OpenAI.Chat.ChatCompletion & { fromCache?: boolean }> {
  const { cacheEnabled = true, cacheTTL, cacheBypassCondition } = options;

  // Extract the user message for cache key
  const userMessages = params.messages.filter(m => m.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1];
  const prompt = typeof lastUserMessage?.content === "string" ? lastUserMessage.content : "";
  const model = params.model as string;

  if (cacheEnabled && prompt && !cacheBypassCondition?.(prompt)) {
    const cached = globalAICache.get(prompt, model);
    if (cached) {
      // Construct a fake response that matches the OpenAI shape
      return {
        id: "cached",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          message: { role: "assistant", content: cached, refusal: null },
          finish_reason: "stop",
          logprobs: null,
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        fromCache: true,
      } as any;
    }
  }

  const result = await createChatCompletion(params, model);
  const responseText = result.choices[0]?.message?.content ?? "";

  if (cacheEnabled && prompt && responseText && !cacheBypassCondition?.(prompt)) {
    globalAICache.set(prompt, model, responseText, {
      tokenCount: result.usage?.completion_tokens,
      ttl: cacheTTL,
    });
  }

  return result;
}

// ── Cache Analytics ───────────────────────────────────────────────────────────

export interface CacheAnalytics {
  hitRatePercent: string;
  entriesCount: number;
  estimatedMemoryKB: string;
  topPrompts: Array<{ prompt: string; hits: number; model: string }>;
  savings: {
    requestsSaved: number;
    estimatedTokensSaved: number;
    estimatedCostSaved: string;
  };
}

/**
 * Returns a human-readable analytics summary of cache performance.
 */
export function getCacheAnalytics(): CacheAnalytics {
  const stats = globalAICache.getStats();
  const topEntries = globalAICache.getTopEntries(5);

  const estimatedTokensSaved = topEntries.reduce((sum, e) => sum + e.tokens * e.hits, 0);
  const estimatedCostSaved = (estimatedTokensSaved / 1_000_000 * 0.50).toFixed(4); // rough estimate

  return {
    hitRatePercent: `${(stats.hitRate * 100).toFixed(1)}%`,
    entriesCount: stats.totalEntries,
    estimatedMemoryKB: `${(stats.memorySizeBytes / 1024).toFixed(1)} KB`,
    topPrompts: topEntries.map(e => ({
      prompt: e.prompt.slice(0, 80) + (e.prompt.length > 80 ? "..." : ""),
      hits: e.hits,
      model: e.model,
    })),
    savings: {
      requestsSaved: stats.totalHits,
      estimatedTokensSaved,
      estimatedCostSaved: `$${estimatedCostSaved}`,
    },
  };
}
