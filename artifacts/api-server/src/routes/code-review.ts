/**
 * Code Review API Routes for ZorvixAI
 *
 * Endpoints:
 *   POST /api/code/review    — Full AI-powered code review
 *   POST /api/code/explain   — Plain-language code explanation
 *   POST /api/code/optimize  — Performance & quality optimization suggestions
 *   POST /api/code/security  — Security audit
 *   POST /api/code/convert   — Convert code between languages
 *   POST /api/code/docgen    — Generate JSDoc / docstrings
 *   POST /api/code/test-gen  — Generate unit tests
 *   POST /api/code/analyze   — Static analysis (no AI, instant)
 */

import { Router, type Request, type Response } from "express";
import { createChatCompletion, createChatCompletionStream } from "../lib/ai";
import { analyzeCode } from "../lib/code-analyzer";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

const router = Router();

// ── Full AI Code Review ───────────────────────────────────────────────────────

router.post("/api/code/review", async (req: Request, res: Response): Promise<void> => {
  const { code, language, context, stream: wantStream } = req.body as {
    code: string;
    language?: string;
    context?: string;
    stream?: boolean;
  };

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "code is required" });
    return;
  }

  const staticAnalysis = analyzeCode(code);
  const lang = language ?? staticAnalysis.language.language;

  const systemPrompt = `${ZORVIX_SYSTEM_PROMPT}\n\nYou are a senior code reviewer and software architect. You review code like a principal engineer at Stripe or Google: thorough, precise, constructive, and respectful. Your reviews improve code quality, catch bugs, identify security issues, and teach best practices.`;

  const userPrompt = `Please review this ${lang} code${context ? ` (context: ${context})` : ""}:

\`\`\`${lang}
${code}
\`\`\`

Static analysis found:
- Lines of code: ${staticAnalysis.complexity.linesOfCode}
- Cyclomatic complexity: ${staticAnalysis.complexity.cyclomaticComplexity}
- Security issues: ${staticAnalysis.security.length} (${staticAnalysis.security.filter(s => s.severity === "critical" || s.severity === "high").length} high/critical)
- Performance issues: ${staticAnalysis.performance.length}
- Quality grade: ${staticAnalysis.quality.grade} (${staticAnalysis.quality.overall}/100)

Provide a comprehensive review with these sections:
## Summary
(2-3 sentence overview)

## What's Good
(3-5 specific positive observations)

## Issues Found
(List all bugs, logic errors, edge cases — include line references if possible)

## Security Concerns
(Any security vulnerabilities — be specific)

## Performance
(Any inefficiencies or anti-patterns)

## Improvements
(Concrete, actionable suggestions with code examples)

## Refactored Code
(If significant improvements are needed, show the improved version)`;

  if (wantStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  } else {
    try {
      const result = await createChatCompletion({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 100000,
      });

      const review = result.choices[0]?.message?.content ?? "";
      res.json({
        review,
        staticAnalysis: {
          language: staticAnalysis.language,
          complexity: staticAnalysis.complexity,
          security: staticAnalysis.security,
          performance: staticAnalysis.performance,
          quality: staticAnalysis.quality,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Code Explanation ──────────────────────────────────────────────────────────

router.post("/api/code/explain", async (req: Request, res: Response): Promise<void> => {
  const { code, language, audience } = req.body as {
    code: string;
    language?: string;
    audience?: "beginner" | "intermediate" | "expert";
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }

  const detected = analyzeCode(code);
  const lang = language ?? detected.language.language;
  const level = audience ?? "intermediate";

  const levelDescriptions = {
    beginner: "Explain in plain language a beginner can understand. Avoid jargon. Use analogies.",
    intermediate: "Explain clearly for a developer who knows the basics but may not know this specific pattern.",
    expert: "Be technical and precise. Assume deep knowledge. Focus on non-obvious aspects.",
  };

  try {
    const result = await createChatCompletion({
      messages: [
        {
          role: "user",
          content: `Explain what this ${lang} code does. ${levelDescriptions[level]}

\`\`\`${lang}
${code}
\`\`\`

Structure your explanation:
## What It Does
(Overall purpose in 1-2 sentences)

## How It Works
(Step-by-step walkthrough)

## Key Concepts
(Any patterns, algorithms, or concepts used)

## Example Usage
(How you'd use this in practice)`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ explanation: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Code Optimization ─────────────────────────────────────────────────────────

router.post("/api/code/optimize", async (req: Request, res: Response): Promise<void> => {
  const { code, language, goals } = req.body as {
    code: string;
    language?: string;
    goals?: string[];
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }

  const detected = analyzeCode(code);
  const lang = language ?? detected.language.language;
  const optimizationGoals = goals?.join(", ") ?? "performance, readability, and maintainability";

  try {
    const result = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${ZORVIX_SYSTEM_PROMPT}\n\nYou are a performance optimization expert and code quality specialist. You rewrite code to be faster, cleaner, and more maintainable without changing behavior.`,
        },
        {
          role: "user",
          content: `Optimize this ${lang} code for ${optimizationGoals}:

\`\`\`${lang}
${code}
\`\`\`

Provide:
## Identified Bottlenecks
(What's slow, inefficient, or hard to maintain)

## Optimized Code
\`\`\`${lang}
[optimized version here]
\`\`\`

## Changes Made
(Bullet list of every change and why it improves the code)

## Performance Impact
(Estimated improvement — time complexity, memory, readability)`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ optimization: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Security Audit ────────────────────────────────────────────────────────────

router.post("/api/code/security", async (req: Request, res: Response): Promise<void> => {
  const { code, language } = req.body as { code: string; language?: string };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }

  const detected = analyzeCode(code);
  const lang = language ?? detected.language.language;
  const staticIssues = detected.security;

  try {
    const result = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${ZORVIX_SYSTEM_PROMPT}\n\nYou are a security engineer and penetration tester specializing in application security. You identify vulnerabilities using OWASP standards and provide concrete remediation steps.`,
        },
        {
          role: "user",
          content: `Perform a thorough security audit on this ${lang} code:

\`\`\`${lang}
${code}
\`\`\`

Static analysis already found ${staticIssues.length} potential issues.

Provide a complete security audit covering:
## OWASP Top 10 Assessment
(Check each relevant category)

## Vulnerabilities Found
(For each: severity, description, exploit scenario, fix)

## Secure Code
\`\`\`${lang}
[secured version with all vulnerabilities fixed]
\`\`\`

## Security Best Practices Applied
(List all security improvements made)`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({
      audit: result.choices[0]?.message?.content ?? "",
      staticIssues,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Code Conversion ───────────────────────────────────────────────────────────

router.post("/api/code/convert", async (req: Request, res: Response): Promise<void> => {
  const { code, fromLanguage, toLanguage } = req.body as {
    code: string;
    fromLanguage: string;
    toLanguage: string;
  };

  if (!code || !toLanguage) {
    res.status(400).json({ error: "code and toLanguage are required" });
    return;
  }

  const from = fromLanguage ?? analyzeCode(code).language.language;

  try {
    const result = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${ZORVIX_SYSTEM_PROMPT}\n\nYou are an expert polyglot programmer. You convert code between languages idiomatically — not just translating syntax, but using the target language's patterns, idioms, and best practices.`,
        },
        {
          role: "user",
          content: `Convert this ${from} code to ${toLanguage}. Use idiomatic ${toLanguage} patterns, not just direct translation:

\`\`\`${from}
${code}
\`\`\`

Provide:
## Converted Code
\`\`\`${toLanguage}
[converted code here]
\`\`\`

## Key Differences
(Explain the important differences between how ${from} and ${toLanguage} handle this)

## Dependencies Required
(Any packages/imports needed for the ${toLanguage} version)`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ conversion: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Documentation Generator ───────────────────────────────────────────────────

router.post("/api/code/docgen", async (req: Request, res: Response): Promise<void> => {
  const { code, language, style } = req.body as {
    code: string;
    language?: string;
    style?: "jsdoc" | "tsdoc" | "docstring" | "rustdoc" | "auto";
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }

  const detected = analyzeCode(code);
  const lang = language ?? detected.language.language;
  const docStyle = style ?? "auto";

  try {
    const result = await createChatCompletion({
      messages: [
        {
          role: "user",
          content: `Add comprehensive documentation to this ${lang} code using ${docStyle === "auto" ? "the appropriate doc style for " + lang : docStyle} format.

Document every:
- Function / method (params, return type, throws, example)
- Class / interface
- Module-level exports
- Complex algorithms (explain the approach inline)

\`\`\`${lang}
${code}
\`\`\`

Return ONLY the fully documented code, no extra explanation.`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ documented: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Unit Test Generator ───────────────────────────────────────────────────────

router.post("/api/code/test-gen", async (req: Request, res: Response): Promise<void> => {
  const { code, language, framework } = req.body as {
    code: string;
    language?: string;
    framework?: string;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }

  const detected = analyzeCode(code);
  const lang = language ?? detected.language.language;

  const testFrameworks: Record<string, string> = {
    typescript: "Jest with TypeScript",
    javascript: "Jest",
    python: "pytest",
    java: "JUnit 5",
    rust: "built-in Rust test framework",
    go: "Go testing package",
  };

  const testFw = framework ?? testFrameworks[lang] ?? "the appropriate testing framework";

  try {
    const result = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${ZORVIX_SYSTEM_PROMPT}\n\nYou are a test-driven development expert. You write comprehensive, practical unit tests that cover happy paths, edge cases, error conditions, and boundary values.`,
        },
        {
          role: "user",
          content: `Write comprehensive unit tests for this ${lang} code using ${testFw}:

\`\`\`${lang}
${code}
\`\`\`

Include tests for:
1. Happy path (expected inputs, expected outputs)
2. Edge cases (empty, null, boundary values, max/min)
3. Error conditions (invalid input, exceptions)
4. Any async behavior (if applicable)

Use descriptive test names that explain WHAT is being tested and WHAT the expected behavior is.`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ tests: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Static Analysis (no AI, instant) ─────────────────────────────────────────

router.post("/api/code/analyze", (req: Request, res: Response): void => {
  const { code } = req.body as { code: string };
  if (!code) { res.status(400).json({ error: "code is required" }); return; }

  try {
    const result = analyzeCode(code);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
