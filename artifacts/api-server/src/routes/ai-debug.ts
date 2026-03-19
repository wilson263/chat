/**
 * AI Debugging Assistant for ZorvixAI
 *
 * Endpoints:
 *   POST /api/debug/analyze        — Analyze error messages & stack traces
 *   POST /api/debug/fix            — Suggest a fix for a bug with code
 *   POST /api/debug/explain-error  — Plain-language error explanation
 *   POST /api/debug/trace          — Trace a logical bug in code
 *   POST /api/debug/root-cause     — Root cause analysis for complex bugs
 *   POST /api/debug/env-check      — Check if environment variables are valid
 */

import { Router, type Request, type Response } from "express";
import { createChatCompletion } from "../lib/ai";
import { analyzeCode } from "../lib/code-analyzer";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

const router = Router();

const DEBUGGER_SYSTEM_PROMPT = `${ZORVIX_SYSTEM_PROMPT}\n\nYou are ZorvixAI's debugging specialist — an expert debugger who has fixed thousands of bugs across all programming languages and frameworks. You think systematically:

1. READ the error carefully — what does it literally say?
2. LOCATE — what file, line, function is the source?
3. UNDERSTAND — why did this error occur?
4. ROOT CAUSE — what is the underlying reason (not just the symptom)?
5. FIX — what is the minimal, correct fix?
6. PREVENT — how do we prevent this class of bug in the future?

You are precise, thorough, and always give working solutions. You distinguish between the error symptom and the root cause.`;

// ── Error Analysis ────────────────────────────────────────────────────────────

router.post("/api/debug/analyze", async (req: Request, res: Response): Promise<void> => {
  const { error, code, language, context } = req.body as {
    error: string;
    code?: string;
    language?: string;
    context?: string;
  };

  if (!error) { res.status(400).json({ error: "error message is required" }); return; }

  const lang = language ?? (code ? analyzeCode(code).language.language : "unknown");

  const codeSection = code
    ? `\n\nRelevant code:\n\`\`\`${lang}\n${code}\n\`\`\``
    : "";

  const contextSection = context ? `\n\nAdditional context: ${context}` : "";

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: DEBUGGER_SYSTEM_PROMPT },
        {
          role: "user",
          content: `I'm getting this error:

\`\`\`
${error}
\`\`\`
${codeSection}${contextSection}

Please analyze this error and provide:

## Error Type
(What category of error this is)

## What Happened
(Plain English explanation of what went wrong)

## Root Cause
(The underlying reason — not just the symptom)

## Where to Look
(Specific files, lines, or functions to investigate)

## Fix
(Exact steps to resolve the issue, with corrected code if applicable)

## Prevention
(How to avoid this class of error in the future)`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ analysis: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Bug Fix Suggester ─────────────────────────────────────────────────────────

router.post("/api/debug/fix", async (req: Request, res: Response): Promise<void> => {
  const { code, error, description, language } = req.body as {
    code: string;
    error?: string;
    description?: string;
    language?: string;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  if (!error && !description) { res.status(400).json({ error: "error or description of the bug is required" }); return; }

  const lang = language ?? analyzeCode(code).language.language;

  const bugDescription = error
    ? `Error message:\n\`\`\`\n${error}\n\`\`\``
    : `Problem description: ${description}`;

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: DEBUGGER_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Fix the bug in this ${lang} code.

${bugDescription}

Buggy code:
\`\`\`${lang}
${code}
\`\`\`

Provide:

## Bug Found
(Identify the exact bug — location and cause)

## Fixed Code
\`\`\`${lang}
[complete corrected code here]
\`\`\`

## What Changed
(Line-by-line explanation of every fix)

## Why This Fixes It
(Why the original code was wrong and why the fix works)`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ fix: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Error Explainer ───────────────────────────────────────────────────────────

router.post("/api/debug/explain-error", async (req: Request, res: Response): Promise<void> => {
  const { error, language } = req.body as { error: string; language?: string };

  if (!error) { res.status(400).json({ error: "error is required" }); return; }

  try {
    const result = await createChatCompletion({
      messages: [
        {
          role: "user",
          content: `Explain this${language ? " " + language : ""} error in simple terms that a junior developer would understand. Be clear and practical:

\`\`\`
${error}
\`\`\`

Explain:
1. What this error means in plain English
2. The most common reason it occurs
3. How to fix it (step by step)
4. A quick example of correct code

Keep it concise and actionable.`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ explanation: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Logic Bug Tracer ──────────────────────────────────────────────────────────

router.post("/api/debug/trace", async (req: Request, res: Response): Promise<void> => {
  const { code, expectedBehavior, actualBehavior, language, inputs } = req.body as {
    code: string;
    expectedBehavior: string;
    actualBehavior: string;
    language?: string;
    inputs?: string;
  };

  if (!code || !expectedBehavior || !actualBehavior) {
    res.status(400).json({ error: "code, expectedBehavior, and actualBehavior are required" });
    return;
  }

  const lang = language ?? analyzeCode(code).language.language;

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: DEBUGGER_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Trace this logic bug in my ${lang} code:

Code:
\`\`\`${lang}
${code}
\`\`\`

Expected behavior: ${expectedBehavior}
Actual behavior: ${actualBehavior}
${inputs ? `Test inputs: ${inputs}` : ""}

Please:
1. Trace through the code execution step-by-step
2. Identify exactly where the logic diverges from expected behavior
3. Explain WHY it produces the wrong result
4. Provide the corrected code
5. Add a test case that would catch this bug`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ trace: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Root Cause Analysis ───────────────────────────────────────────────────────

router.post("/api/debug/root-cause", async (req: Request, res: Response): Promise<void> => {
  const { symptoms, code, logs, language } = req.body as {
    symptoms: string;
    code?: string;
    logs?: string;
    language?: string;
  };

  if (!symptoms) { res.status(400).json({ error: "symptoms description is required" }); return; }

  const codeSection = code ? `\n\nCode:\n\`\`\`${language ?? "unknown"}\n${code}\n\`\`\`` : "";
  const logsSection = logs ? `\n\nLogs:\n\`\`\`\n${logs}\n\`\`\`` : "";

  try {
    const result = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${DEBUGGER_SYSTEM_PROMPT}

Use the "5 Whys" technique: keep asking WHY until you reach the true root cause, not just the surface symptom.`,
        },
        {
          role: "user",
          content: `Perform a root cause analysis for this problem:

Symptoms: ${symptoms}
${codeSection}${logsSection}

Apply the 5 Whys methodology and provide:

## Problem Statement
(Clear description of what's going wrong)

## 5 Whys Analysis
Why #1: [surface symptom] → Because...
Why #2: [reason] → Because...
Why #3: [deeper reason] → Because...
Why #4: [underlying cause] → Because...
Why #5: [root cause]

## Root Cause
(The fundamental issue that, if fixed, prevents this and similar problems)

## Solutions
(Short-term fix + long-term systemic fix)

## Prevention
(Process or code changes to prevent this class of bug)`,
        },
      ],
      max_completion_tokens: 100000,
    });

    res.json({ rootCause: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Environment Variable Checker ──────────────────────────────────────────────

router.post("/api/debug/env-check", (req: Request, res: Response): void => {
  const { requiredVars } = req.body as { requiredVars?: string[] };

  const envVarsToCheck = requiredVars ?? [
    "DATABASE_URL", "OPENROUTER_API_KEY", "SESSION_SECRET",
    "PORT", "NODE_ENV", "SMTP_HOST",
  ];

  const results: Record<string, { set: boolean; hint?: string }> = {};

  for (const key of envVarsToCheck) {
    const val = process.env[key];
    results[key] = {
      set: !!val && val.length > 0,
      hint: !val ? `${key} is not set — this may cause issues` : undefined,
    };
  }

  const missingCount = Object.values(results).filter(r => !r.set).length;

  res.json({
    results,
    summary: missingCount === 0
      ? "All checked environment variables are set."
      : `${missingCount} environment variable(s) are missing.`,
    missingCount,
  });
});

export default router;
