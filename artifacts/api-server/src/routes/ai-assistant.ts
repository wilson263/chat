/**
 * Personal AI Assistant Routes for ZorvixAI
 *
 * A context-aware AI assistant that helps with planning, task management,
 * code explanation, and intelligent follow-up questions.
 *
 * Endpoints:
 *   POST /api/assistant/plan         — Break any goal into actionable steps
 *   POST /api/assistant/explain      — Explain anything (code, error, concept)
 *   POST /api/assistant/improve      — Improve any text/code/content
 *   POST /api/assistant/brainstorm   — Brainstorm ideas with structure
 *   POST /api/assistant/summarize    — Summarize long content intelligently
 *   POST /api/assistant/translate    — Translate code between languages
 *   POST /api/assistant/followup     — Generate smart follow-up questions
 *   POST /api/assistant/critique     — Critique any work with specific feedback
 */

import { Router, type Request, type Response } from "express";
import { createChatCompletion, createChatCompletionStream } from "../lib/ai";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

const router = Router();

const ASSISTANT_SYSTEM = `${ZORVIX_SYSTEM_PROMPT}\n\nYou are ZorvixAI, an elite AI assistant for developers. You are:
- Deeply technical but can adjust to any level
- Proactively helpful — you anticipate follow-up needs
- Specific and actionable — never vague
- Honest about uncertainty and limitations
- Efficient with the user's time — no filler, no fluff

When answering, always prioritize correctness over confidence. If you're unsure, say so.`;

// ── Smart Goal Planner ────────────────────────────────────────────────────────

router.post("/api/assistant/plan", async (req: Request, res: Response): Promise<void> => {
  const { goal, context, constraints, timeframe, stream: wantStream } = req.body as {
    goal: string;
    context?: string;
    constraints?: string;
    timeframe?: string;
    stream?: boolean;
  };

  if (!goal) { res.status(400).json({ error: "goal is required" }); return; }

  const prompt = `Create a detailed, actionable plan to achieve: ${goal}

${context ? `Context: ${context}` : ""}
${constraints ? `Constraints: ${constraints}` : ""}
${timeframe ? `Timeframe: ${timeframe}` : ""}

Provide:

## Goal Analysis
(Clarify what success looks like, identify potential ambiguities)

## Prerequisites
(What must be in place before starting)

## Action Plan
(Numbered steps, each with: action → expected outcome → potential blocker → mitigation)

## Timeline
(Realistic time estimate for each step and total)

## Critical Path
(The sequence that determines minimum completion time)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|

## Definition of Done
(Specific, measurable criteria that confirm the goal is achieved)

## Quick Wins
(What can be done in the first hour to build momentum)`;

  if (wantStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
      const stream = await createChatCompletionStream({
        messages: [{ role: "system", content: ASSISTANT_SYSTEM }, { role: "user", content: prompt }],
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
    try {
      const result = await createChatCompletion({
        messages: [{ role: "system", content: ASSISTANT_SYSTEM }, { role: "user", content: prompt }],
        max_completion_tokens: 100000,
      });
      res.json({ plan: result.choices[0]?.message?.content ?? "" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Universal Explainer ───────────────────────────────────────────────────────

router.post("/api/assistant/explain", async (req: Request, res: Response): Promise<void> => {
  const { content, type, level, stream: wantStream } = req.body as {
    content: string;
    type?: "code" | "error" | "concept" | "documentation" | "auto";
    level?: "eli5" | "beginner" | "intermediate" | "advanced";
    stream?: boolean;
  };

  if (!content) { res.status(400).json({ error: "content is required" }); return; }

  const detectedType = type ?? "auto";
  const targetLevel = level ?? "intermediate";

  const levelInstructions = {
    eli5: "Explain like I'm 5 years old. Use simple words, everyday analogies, no technical jargon.",
    beginner: "Explain for a programming beginner. Avoid jargon or explain it when you must use it.",
    intermediate: "Explain for a competent developer. Use technical terms normally, go one level deeper.",
    advanced: "Explain at expert level. Cover implementation details, edge cases, internals, trade-offs.",
  };

  const prompt = `Explain the following ${detectedType !== "auto" ? detectedType : "content"} at ${targetLevel} level:

${content}

Level instructions: ${levelInstructions[targetLevel]}

Structure your explanation:
1. **What it is** (in one sentence)
2. **Why it matters** (practical significance)
3. **How it works** (step by step, with examples)
4. **Common questions** (anticipate what the reader is wondering)
5. **Key takeaways** (3 bullet points to remember)

${detectedType === "error" || detectedType === "auto" ? "If this is an error: explain what caused it and exactly how to fix it." : ""}
${detectedType === "code" || detectedType === "auto" ? "If this is code: explain what each part does, any tricky patterns, and potential improvements." : ""}`;

  if (wantStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
      const stream = await createChatCompletionStream({
        messages: [{ role: "system", content: ASSISTANT_SYSTEM }, { role: "user", content: prompt }],
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
    try {
      const result = await createChatCompletion({
        messages: [{ role: "system", content: ASSISTANT_SYSTEM }, { role: "user", content: prompt }],
        max_completion_tokens: 100000,
      });
      res.json({ explanation: result.choices[0]?.message?.content ?? "" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Content Improver ──────────────────────────────────────────────────────────

router.post("/api/assistant/improve", async (req: Request, res: Response): Promise<void> => {
  const { content, contentType, goals, preserveVoice } = req.body as {
    content: string;
    contentType?: "code" | "prose" | "email" | "documentation" | "commit-message" | "pr-description";
    goals?: string[];
    preserveVoice?: boolean;
  };

  if (!content) { res.status(400).json({ error: "content is required" }); return; }

  const type = contentType ?? "prose";
  const goalsList = goals?.join(", ") ?? "clarity, quality, effectiveness";

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM },
        {
          role: "user",
          content: `Improve this ${type} with focus on: ${goalsList}
${preserveVoice ? "IMPORTANT: Preserve the author's voice and style — improve without changing personality." : ""}

Content to improve:
${content}

Provide:
## Issues Found
(Specific problems: unclear sections, weak language, structural issues)

## Improved Version
[The improved content]

## Changes Made
(Bullet list: what changed → why it's better)

## Further Suggestions
(Optional improvements that go beyond the current scope)`,
        },
      ],
      max_completion_tokens: 100000,
    });
    res.json({ result: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Idea Brainstormer ─────────────────────────────────────────────────────────

router.post("/api/assistant/brainstorm", async (req: Request, res: Response): Promise<void> => {
  const { topic, context, quantity, constraints, divergent } = req.body as {
    topic: string;
    context?: string;
    quantity?: number;
    constraints?: string;
    divergent?: boolean;
  };

  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  const count = Math.min(quantity ?? 15, 30);

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM },
        {
          role: "user",
          content: `Brainstorm ${count} ideas for: ${topic}
${context ? `Context: ${context}` : ""}
${constraints ? `Constraints: ${constraints}` : ""}

${divergent ? "Include both practical/conventional AND wild/unconventional ideas. Push the boundaries." : "Focus on practical, implementable ideas."}

For each idea:
## Idea N: [Name]
**Description**: (2-3 sentences)
**Why it could work**: (key insight)
**Potential challenges**: (honest assessment)
**Quick implementation path**: (first steps)
**Originality**: [Common | Interesting | Novel | Breakthrough]

End with:
## Top 3 Recommendations
(The 3 ideas most worth pursuing, with rationale)`,
        },
      ],
      max_completion_tokens: 100000,
    });
    res.json({ ideas: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Intelligent Summarizer ────────────────────────────────────────────────────

router.post("/api/assistant/summarize", async (req: Request, res: Response): Promise<void> => {
  const { content, length, audience, format, focusAreas } = req.body as {
    content: string;
    length?: "brief" | "medium" | "detailed";
    audience?: string;
    format?: "bullet" | "narrative" | "structured";
    focusAreas?: string[];
  };

  if (!content) { res.status(400).json({ error: "content is required" }); return; }

  const summaryLength = {
    brief: "3-5 bullet points or 2-3 sentences maximum",
    medium: "a few paragraphs covering main points",
    detailed: "comprehensive summary covering all key points with structure",
  };

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM },
        {
          role: "user",
          content: `Summarize the following content:
${content.slice(0, 8000)}

Length: ${summaryLength[length ?? "medium"]}
Format: ${format ?? "structured"}
Target audience: ${audience ?? "general developer"}
${focusAreas?.length ? `Focus especially on: ${focusAreas.join(", ")}` : ""}

${format === "structured" ? `Structure:
## Main Point
## Key Details
## Implications/Actions
## What Was Left Out` : ""}`,
        },
      ],
      max_completion_tokens: 100000,
    });
    res.json({ summary: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Code Translator ───────────────────────────────────────────────────────────

router.post("/api/assistant/translate", async (req: Request, res: Response): Promise<void> => {
  const { code, fromLanguage, toLanguage, preserveComments } = req.body as {
    code: string;
    fromLanguage: string;
    toLanguage: string;
    preserveComments?: boolean;
  };

  if (!code || !fromLanguage || !toLanguage) {
    res.status(400).json({ error: "code, fromLanguage, and toLanguage are required" });
    return;
  }

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM },
        {
          role: "user",
          content: `Translate this ${fromLanguage} code to ${toLanguage}:

\`\`\`${fromLanguage}
${code}
\`\`\`

Rules for translation:
1. Use idiomatic ${toLanguage} — don't just transliterate syntax, use the language's patterns
2. Use the ${toLanguage} standard library equivalents instead of custom implementations
3. Maintain the same logic and behavior exactly
4. ${preserveComments !== false ? "Translate/adapt all comments" : "Skip comments in the output"}
5. Note any language-specific differences or limitations

## Translation Notes
(Key differences between ${fromLanguage} and ${toLanguage} relevant to this code)

## Translated Code
\`\`\`${toLanguage}
[Complete translation]
\`\`\`

## Behavioral Differences
(Any edge cases where the translation behaves differently)

## ${toLanguage}-Specific Improvements
(Idioms or patterns in ${toLanguage} that improve on the original)`,
        },
      ],
      max_completion_tokens: 100000,
    });
    res.json({ translation: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Smart Follow-up Generator ─────────────────────────────────────────────────

router.post("/api/assistant/followup", async (req: Request, res: Response): Promise<void> => {
  const { conversation, lastMessage, count } = req.body as {
    conversation?: string;
    lastMessage: string;
    count?: number;
  };

  if (!lastMessage) { res.status(400).json({ error: "lastMessage is required" }); return; }

  const questionCount = Math.min(count ?? 5, 10);

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM },
        {
          role: "user",
          content: `Generate ${questionCount} smart follow-up questions based on:
${conversation ? `Conversation context:\n${conversation.slice(0, 1000)}\n\n` : ""}Last message: ${lastMessage}

Generate questions that:
- Dig deeper into the most interesting/important aspects
- Anticipate what the person probably wants to know next
- Vary from tactical (how to do X) to strategic (why/when to do X)
- Include at least one question that challenges assumptions

Format as a JSON array:
[
  {
    "question": "...",
    "category": "clarification|deep-dive|practical|strategic|challenge",
    "why": "why this is a valuable follow-up"
  }
]`,
        },
      ],
      max_completion_tokens: 100000,
    });

    const raw = result.choices[0]?.message?.content ?? "[]";
    let questions;
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      questions = match ? JSON.parse(match[0]) : [];
    } catch {
      questions = [];
    }
    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Constructive Critic ───────────────────────────────────────────────────────

router.post("/api/assistant/critique", async (req: Request, res: Response): Promise<void> => {
  const { work, workType, criteria, severity } = req.body as {
    work: string;
    workType?: string;
    criteria?: string[];
    severity?: "gentle" | "balanced" | "harsh";
  };

  if (!work) { res.status(400).json({ error: "work is required" }); return; }

  const severityInstructions = {
    gentle: "Be encouraging and focus on the positives while gently noting areas for improvement.",
    balanced: "Give honest, balanced feedback. Don't sugarcoat, but be constructive.",
    harsh: "Be a ruthless critic. Point out every flaw. The person wants brutal honesty to improve.",
  };

  const evaluationCriteria = criteria ?? ["quality", "clarity", "completeness", "correctness", "efficiency"];

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM },
        {
          role: "user",
          content: `Critique this ${workType ?? "work"}:
${work.slice(0, 5000)}

${severityInstructions[severity ?? "balanced"]}

Evaluate on: ${evaluationCriteria.join(", ")}

## Overall Assessment
(Overall rating and one-paragraph summary)

## Strengths
(What is genuinely good — be specific, not generic praise)

## Areas for Improvement
(Each issue: what's wrong → why it's a problem → specific fix)

## Critical Issues
(Any showstopper problems that must be fixed)

## Specific Line/Section Feedback
(Detailed feedback on specific parts)

## Suggested Next Steps
(Prioritized list of improvements to make)

## Revised Example
(Rewrite one key section to demonstrate the improvements)`,
        },
      ],
      max_completion_tokens: 100000,
    });
    res.json({ critique: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
