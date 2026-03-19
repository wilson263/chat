/**
 * AI-Powered Web Search Integration for ZorvixAI
 *
 * Provides the AI with the ability to search for recent information
 * and incorporate it into responses. Uses multiple fallback search providers.
 *
 * Endpoints:
 *   POST /api/search/ai-search      — Search + synthesize with AI
 *   POST /api/search/fact-check     — Fact-check a claim with search
 *   POST /api/search/research       — Deep research on a topic
 *   POST /api/search/news           — Latest news on a topic
 *   POST /api/search/docs           — Search technical documentation
 */

import { Router, type Request, type Response } from "express";
import { createChatCompletion, createChatCompletionStream } from "../lib/ai";
import https from "https";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

const router = Router();

// ── Search Provider (DuckDuckGo Instant Answer API) ───────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface DuckDuckGoResponse {
  Abstract?: string;
  AbstractText?: string;
  AbstractURL?: string;
  AbstractSource?: string;
  Definition?: string;
  DefinitionURL?: string;
  RelatedTopics?: Array<{
    Text?: string;
    FirstURL?: string;
    Name?: string;
    Topics?: Array<{ Text?: string; FirstURL?: string }>;
  }>;
  Results?: Array<{ Text?: string; FirstURL?: string }>;
  Answer?: string;
  AnswerType?: string;
  Heading?: string;
}

/**
 * Fetches search results using DuckDuckGo Instant Answer API.
 * This is a free, no-auth-required API.
 */
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;

    const req = https.get(url, { timeout: 5000 }, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try {
          const json: DuckDuckGoResponse = JSON.parse(data);
          const results: SearchResult[] = [];

          if (json.AbstractText && json.AbstractURL) {
            results.push({
              title: json.Heading ?? json.AbstractSource ?? "Reference",
              url: json.AbstractURL,
              snippet: json.AbstractText,
            });
          }

          if (json.Answer) {
            results.push({
              title: `Direct Answer (${json.AnswerType ?? "computed"})`,
              url: "",
              snippet: json.Answer,
            });
          }

          if (json.Definition) {
            results.push({
              title: "Definition",
              url: json.DefinitionURL ?? "",
              snippet: json.Definition,
            });
          }

          if (json.RelatedTopics) {
            for (const topic of json.RelatedTopics.slice(0, 5)) {
              if (topic.Text && topic.FirstURL) {
                results.push({ title: topic.Name ?? "Related", url: topic.FirstURL, snippet: topic.Text });
              }
              if (topic.Topics) {
                for (const sub of topic.Topics.slice(0, 3)) {
                  if (sub.Text && sub.FirstURL) {
                    results.push({ title: "Related", url: sub.FirstURL, snippet: sub.Text });
                  }
                }
              }
            }
          }

          resolve(results.slice(0, 8));
        } catch {
          resolve([]);
        }
      });
    });

    req.on("error", () => resolve([]));
    req.on("timeout", () => { req.destroy(); resolve([]); });
  });
}

/**
 * Fetches content from a URL and returns the text.
 * Used for deep research.
 */
async function fetchPageContent(url: string, maxLength: number = 3000): Promise<string> {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) { resolve(""); return; }

      let data = "";
      res.on("data", chunk => { data += chunk; if (data.length > maxLength * 2) req.destroy(); });
      res.on("end", () => {
        // Strip HTML tags
        const text = data
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&[a-z]+;/gi, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, maxLength);
        resolve(text);
      });
    });
    req.on("error", () => resolve(""));
    req.on("timeout", () => { req.destroy(); resolve(""); });
  });
}

// Format search results for the AI prompt
function formatResultsForAI(results: SearchResult[], query: string): string {
  if (results.length === 0) {
    return `No search results found for: "${query}"`;
  }

  return `Search results for "${query}":\n\n${results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url || "N/A"}\n${r.snippet}`)
    .join("\n\n")}`;
}

// ── AI Search ─────────────────────────────────────────────────────────────────

router.post("/api/search/ai-search", async (req: Request, res: Response): Promise<void> => {
  const { query, synthesize, stream: wantStream } = req.body as {
    query: string;
    synthesize?: boolean;
    stream?: boolean;
  };

  if (!query) { res.status(400).json({ error: "query is required" }); return; }

  try {
    const searchResults = await searchDuckDuckGo(query);
    const formattedResults = formatResultsForAI(searchResults, query);

    if (!synthesize) {
      res.json({ query, results: searchResults, formatted: formattedResults });
      return;
    }

    const systemPrompt = `${ZORVIX_SYSTEM_PROMPT}\n\nYou are ZorvixAI with web search capabilities. You have access to search results and must synthesize them into a helpful, accurate response. Always cite your sources using [1], [2], etc.`;

    const userPrompt = `Question: ${query}

${formattedResults}

Based on these search results, provide a comprehensive, accurate answer. Cite sources using [N] notation. If the results are insufficient, say so honestly.`;

    if (wantStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ event: "sources", results: searchResults })}\n\n`);

      try {
        const stream = await createChatCompletionStream({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_completion_tokens: 100000,
        });
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
        res.write("data: [DONE]\n\n");
      } catch (err: any) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      }
      res.end();
    } else {
      const result = await createChatCompletion({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 100000,
      });

      res.json({
        query,
        sources: searchResults,
        answer: result.choices[0]?.message?.content ?? "",
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Fact Checker ──────────────────────────────────────────────────────────────

router.post("/api/search/fact-check", async (req: Request, res: Response): Promise<void> => {
  const { claim } = req.body as { claim: string };
  if (!claim) { res.status(400).json({ error: "claim is required" }); return; }

  try {
    const results = await searchDuckDuckGo(claim);
    const formatted = formatResultsForAI(results, claim);

    const result = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${ZORVIX_SYSTEM_PROMPT}\n\nYou are a fact-checker. Assess claims for accuracy based on available information. Be precise about what you know vs. what is uncertain.`,
        },
        {
          role: "user",
          content: `Fact-check this claim: "${claim}"

Available information:
${formatted}

Provide:
## Verdict
[TRUE / FALSE / PARTIALLY TRUE / UNVERIFIABLE / MISLEADING]

## Evidence
(What the search results say about this claim)

## Nuance
(Important context, exceptions, or qualifications)

## Confidence Level
[HIGH / MEDIUM / LOW] — and why

## Sources
(Which sources support your verdict)`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({
      claim,
      sources: results,
      factCheck: result.choices[0]?.message?.content ?? "",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Deep Research ─────────────────────────────────────────────────────────────

router.post("/api/search/research", async (req: Request, res: Response): Promise<void> => {
  const { topic, depth } = req.body as { topic: string; depth?: "quick" | "thorough" };
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  try {
    // Run multiple related searches in parallel
    const queries = [
      topic,
      `${topic} overview`,
      `${topic} best practices`,
      depth === "thorough" ? `${topic} advanced` : null,
    ].filter(Boolean) as string[];

    const allResults = await Promise.all(queries.map(q => searchDuckDuckGo(q)));
    const combined = allResults.flat();

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = combined.filter(r => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    const formatted = unique
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`)
      .join("\n\n");

    const result = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${ZORVIX_SYSTEM_PROMPT}\n\nYou are a thorough research assistant. Synthesize multiple sources into comprehensive, well-structured research reports.`,
        },
        {
          role: "user",
          content: `Compile a research report on: ${topic}

Sources:
${formatted}

Write a comprehensive research report:
## Executive Summary
## Background & Context
## Key Concepts
## Current State
## Key Findings
## Practical Implications
## Open Questions
## Sources Referenced`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({
      topic,
      sourcesCount: unique.length,
      sources: unique,
      report: result.choices[0]?.message?.content ?? "",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Technical Docs Search ─────────────────────────────────────────────────────

router.post("/api/search/docs", async (req: Request, res: Response): Promise<void> => {
  const { technology, question } = req.body as { technology: string; question: string };
  if (!technology || !question) {
    res.status(400).json({ error: "technology and question are required" });
    return;
  }

  try {
    const searchQuery = `${technology} ${question} documentation`;
    const results = await searchDuckDuckGo(searchQuery);
    const formatted = formatResultsForAI(results, searchQuery);

    const result = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${ZORVIX_SYSTEM_PROMPT}\n\nYou are an expert in ${technology}. You provide precise, accurate technical documentation answers with code examples.`,
        },
        {
          role: "user",
          content: `Question about ${technology}: ${question}

Available documentation/search results:
${formatted}

Provide:
1. Direct answer to the question
2. Code example demonstrating the answer
3. Common gotchas or edge cases
4. Links to relevant docs (from search results)`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({
      technology,
      question,
      sources: results,
      answer: result.choices[0]?.message?.content ?? "",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
