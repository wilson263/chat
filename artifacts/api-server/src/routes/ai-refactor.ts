/**
 * Advanced Code Refactoring AI for ZorvixAI
 *
 * Endpoints:
 *   POST /api/refactor/clean        — Clean up messy code
 *   POST /api/refactor/extract      — Extract functions, classes, modules
 *   POST /api/refactor/patterns     — Apply design patterns
 *   POST /api/refactor/modernize    — Update legacy code to modern standards
 *   POST /api/refactor/typescript   — Add TypeScript types to JS code
 *   POST /api/refactor/dry          — Remove duplication (DRY principle)
 *   POST /api/refactor/solid        — Apply SOLID principles
 */

import { Router, type Request, type Response } from "express";
import { createChatCompletion, createChatCompletionStream } from "../lib/ai";

const router = Router();

const REFACTOR_SYSTEM = `You are a refactoring expert and clean code specialist. You transform messy, hard-to-maintain code into clean, professional, production-ready code. You follow the principle that code is read 10x more than it's written.

Your refactoring philosophy:
- Small, focused functions (single responsibility)
- Descriptive naming that makes comments unnecessary
- Eliminate duplication ruthlessly (but not at the cost of clarity)
- Make the code tell a story
- Prefer explicit over implicit
- Handle every error case
- Leave the code better than you found it

You always explain WHAT you changed and WHY, with before/after comparisons.`;

// ── Helper for stream/non-stream responses ────────────────────────────────────

async function refactorResponse(
  req: { body: { stream?: boolean } },
  res: Response,
  systemPrompt: string,
  userPrompt: string,
  responseKey: string = "result"
): Promise<void> {
  const wantStream = req.body.stream;

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
        max_completion_tokens: 60000,
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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 60000,
      });
      res.json({ [responseKey]: result.choices[0]?.message?.content ?? "" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

// ── Clean Code Refactor ───────────────────────────────────────────────────────

router.post("/api/refactor/clean", async (req: Request, res: Response): Promise<void> => {
  const { code, language, goals } = req.body as {
    code: string;
    language?: string;
    goals?: string;
    stream?: boolean;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  const lang = language ?? "typescript";

  await refactorResponse(
    req,
    res,
    REFACTOR_SYSTEM,
    `Clean up this ${lang} code following clean code principles:

\`\`\`${lang}
${code}
\`\`\`

${goals ? `Focus on: ${goals}` : ""}

Apply these clean code principles:
1. Meaningful naming (variables, functions, classes)
2. Single responsibility (one function = one job)
3. Keep functions small (< 20 lines ideally)
4. Eliminate magic numbers and strings (use named constants)
5. Consistent formatting and style
6. Remove dead code and unnecessary comments
7. Improve error handling

Provide:
## Issues Found
(List every clean code violation)

## Refactored Code
\`\`\`${lang}
[Complete cleaned version]
\`\`\`

## Changes Made
(Bullet list: what changed → why it's better)

## Naming Improvements
| Old Name | New Name | Why |
|----------|----------|-----|`,
    "result"
  );
});

// ── Extract Functions/Modules ─────────────────────────────────────────────────

router.post("/api/refactor/extract", async (req: Request, res: Response): Promise<void> => {
  const { code, language, extractType } = req.body as {
    code: string;
    language?: string;
    extractType?: "functions" | "classes" | "modules" | "hooks" | "all";
    stream?: boolean;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  const lang = language ?? "typescript";
  const type = extractType ?? "all";

  await refactorResponse(
    req,
    res,
    REFACTOR_SYSTEM,
    `Refactor this ${lang} code by extracting reusable ${type}:

\`\`\`${lang}
${code}
\`\`\`

Identify everything that should be extracted:
- Long functions that do too much (extract sub-functions)
- Repeated logic blocks (extract and reuse)
- Complex logic that deserves its own unit (extract for testability)
- Data transformation logic (extract to pure functions)
${lang === "typescript" || lang === "tsx" ? "- React component logic (extract to custom hooks)" : ""}

For each extraction:
1. Name the extracted piece and explain why it was extracted
2. Show the extracted code
3. Show how the original code uses it

Then show the final refactored version of the original file.

## Extracted Pieces
[List of what was extracted]

## Final Refactored Code
\`\`\`${lang}
[Main file using extracted pieces]
\`\`\`

## Test Strategy
(How to test each extracted piece in isolation)`,
    "result"
  );
});

// ── Design Pattern Application ────────────────────────────────────────────────

router.post("/api/refactor/patterns", async (req: Request, res: Response): Promise<void> => {
  const { code, language, pattern } = req.body as {
    code: string;
    language?: string;
    pattern?: string;
    stream?: boolean;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  const lang = language ?? "typescript";

  await refactorResponse(
    req,
    res,
    REFACTOR_SYSTEM,
    `${pattern
      ? `Apply the ${pattern} design pattern to refactor this ${lang} code:`
      : `Identify and apply the most appropriate design pattern(s) to refactor this ${lang} code:`}

\`\`\`${lang}
${code}
\`\`\`

${!pattern ? `First, identify which design patterns would improve this code and why:
- Factory/Abstract Factory: if object creation is complex
- Strategy: if multiple interchangeable algorithms exist  
- Observer/Event: if components need to react to changes
- Repository: if data access is mixed with business logic
- Command: if operations need undo/redo or queuing
- Decorator: if behavior needs to be added dynamically
- Singleton: if a shared instance is needed (use sparingly)` : ""}

Provide:
## Pattern Analysis
(Which pattern applies and why)

## Before/After Comparison
\`\`\`${lang}
// BEFORE: Original code
${code.slice(0, 300)}...
\`\`\`

\`\`\`${lang}
// AFTER: With design pattern applied
[Complete refactored code]
\`\`\`

## Benefits
(What problems the pattern solves in this specific case)

## Trade-offs
(What complexity the pattern adds — be honest)

## How to Extend
(How to add new behavior without modifying existing code)`,
    "result"
  );
});

// ── Legacy Code Modernizer ────────────────────────────────────────────────────

router.post("/api/refactor/modernize", async (req: Request, res: Response): Promise<void> => {
  const { code, language, targetVersion } = req.body as {
    code: string;
    language?: string;
    targetVersion?: string;
    stream?: boolean;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  const lang = language ?? "javascript";

  const modernTargets: Record<string, string> = {
    javascript: "ES2024 (async/await, optional chaining, nullish coalescing, Array.at(), structuredClone, Object.groupBy)",
    typescript: "TypeScript 5.x (satisfies operator, const type params, variadic tuple types, using declarations)",
    python: "Python 3.12 (match statements, walrus operator, f-strings, dataclasses, type hints)",
    react: "React 18+ (hooks, Suspense, transitions, Server Components patterns)",
    css: "Modern CSS (container queries, :has(), CSS layers, nesting, custom properties)",
  };

  const target = targetVersion ?? modernTargets[lang] ?? "latest standards";

  await refactorResponse(
    req,
    res,
    REFACTOR_SYSTEM,
    `Modernize this ${lang} code to use ${target}:

\`\`\`${lang}
${code}
\`\`\`

Update everything to modern standards:
- Replace outdated patterns with modern equivalents
- Use new language features that improve readability
- Update APIs that have better modern alternatives
- Improve type safety where applicable
- Update async patterns (callbacks → promises → async/await)
- Replace deprecated APIs

## Modernization Changes
| Old Pattern | Modern Equivalent | Reason |
|-------------|-------------------|--------|

## Modernized Code
\`\`\`${lang}
[Complete modernized version]
\`\`\`

## Key Improvements
(Most impactful modernizations with explanation)

## Breaking Changes Warning
(Any changes that could affect behavior or compatibility)`,
    "result"
  );
});

// ── JavaScript to TypeScript ──────────────────────────────────────────────────

router.post("/api/refactor/typescript", async (req: Request, res: Response): Promise<void> => {
  const { code, strictMode } = req.body as {
    code: string;
    strictMode?: boolean;
    stream?: boolean;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  const strict = strictMode !== false;

  await refactorResponse(
    req,
    res,
    REFACTOR_SYSTEM,
    `Convert this JavaScript to ${strict ? "strict " : ""}TypeScript with proper types:

\`\`\`javascript
${code}
\`\`\`

Add comprehensive TypeScript types:
1. Explicit return types on all functions
2. Typed function parameters (avoid \`any\`)
3. Interface/type definitions for all data structures
4. Generic types where appropriate
5. Discriminated unions for state machines
6. Branded types for IDs if applicable
7. Utility types (Partial, Required, Pick, Omit, etc.)
${strict ? "8. Fix all potential null/undefined errors with proper typing" : ""}

## Type Definitions
\`\`\`typescript
// Interfaces and types extracted from the code
\`\`\`

## Fully Typed Code
\`\`\`typescript
[Complete TypeScript version with all types]
\`\`\`

## Type Safety Improvements
(List of type safety benefits gained)

## TypeScript Config
\`\`\`json
// Recommended tsconfig.json settings for this code
\`\`\``,
    "result"
  );
});

// ── DRY Refactoring ───────────────────────────────────────────────────────────

router.post("/api/refactor/dry", async (req: Request, res: Response): Promise<void> => {
  const { code, language } = req.body as {
    code: string;
    language?: string;
    stream?: boolean;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  const lang = language ?? "typescript";

  await refactorResponse(
    req,
    res,
    REFACTOR_SYSTEM,
    `Apply the DRY (Don't Repeat Yourself) principle to refactor this ${lang} code:

\`\`\`${lang}
${code}
\`\`\`

Find ALL duplication — not just copy-paste, but also:
- Similar logic patterns that can be abstracted
- Repeated conditional structures
- Multiple functions doing the same thing slightly differently
- Duplicated validation logic
- Repeated data transformation patterns

For each duplication found:
1. Describe what's duplicated and where
2. Show the unified/abstracted version
3. Show how each original usage is replaced

## Duplication Analysis
| Duplication | Locations | Lines Saved |
|-------------|-----------|-------------|

## Extracted Utilities/Abstractions
\`\`\`${lang}
[All new shared functions/utilities]
\`\`\`

## Refactored Code
\`\`\`${lang}
[Original code using the new shared abstractions]
\`\`\`

## DRY Score
Before: [X] lines, [Y] duplicated blocks
After: [X] lines, 0 duplicated blocks
Lines saved: [Z] (% reduction)`,
    "result"
  );
});

// ── SOLID Principles ──────────────────────────────────────────────────────────

router.post("/api/refactor/solid", async (req: Request, res: Response): Promise<void> => {
  const { code, language, principles } = req.body as {
    code: string;
    language?: string;
    principles?: ("SRP" | "OCP" | "LSP" | "ISP" | "DIP")[];
    stream?: boolean;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  const lang = language ?? "typescript";
  const allPrinciples = ["SRP", "OCP", "LSP", "ISP", "DIP"];
  const targetPrinciples = principles ?? allPrinciples;

  const principleDescriptions = {
    SRP: "Single Responsibility Principle: Each class/function has exactly ONE reason to change",
    OCP: "Open/Closed Principle: Open for extension, closed for modification",
    LSP: "Liskov Substitution Principle: Subtypes must be substitutable for their base types",
    ISP: "Interface Segregation Principle: Many specific interfaces > one general interface",
    DIP: "Dependency Inversion Principle: Depend on abstractions, not concretions",
  };

  const principlesList = targetPrinciples
    .map(p => `- **${p}**: ${principleDescriptions[p]}`)
    .join("\n");

  await refactorResponse(
    req,
    res,
    REFACTOR_SYSTEM,
    `Apply SOLID principles to refactor this ${lang} code:

Principles to apply:
${principlesList}

Code to refactor:
\`\`\`${lang}
${code}
\`\`\`

## SOLID Violations Found
(For each principle, list specific violations in the code)

${targetPrinciples.map(p => `## ${p}: ${principleDescriptions[p].split(":")[0]}
**Violations found:**
[List violations]

**Fix applied:**
\`\`\`${lang}
[Refactored code applying this principle]
\`\`\`
`).join("\n")}

## Final Refactored Code
\`\`\`${lang}
[Complete SOLID-compliant version]
\`\`\`

## Architecture Diagram
\`\`\`
[ASCII diagram showing the clean dependency structure]
\`\`\`

## Benefits Gained
(How the code is now more maintainable, testable, and extensible)`,
    "result"
  );
});

export default router;
