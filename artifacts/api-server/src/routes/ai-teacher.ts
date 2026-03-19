/**
 * AI Teaching Mode for ZorvixAI
 *
 * Endpoints:
 *   POST /api/teach/concept      — Explain any concept at the right level
 *   POST /api/teach/quiz         — Generate interactive quizzes
 *   POST /api/teach/roadmap      — Generate a learning roadmap
 *   POST /api/teach/compare      — Compare two technologies/approaches
 *   POST /api/teach/cheatsheet   — Generate a cheatsheet for any topic
 *   POST /api/teach/interview    — Generate interview prep questions
 *   POST /api/teach/project-ideas — Suggest learning projects
 */

import { Router, type Request, type Response } from "express";
import { createChatCompletion, createChatCompletionStream } from "../lib/ai";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

const router = Router();

const TEACHER_SYSTEM = `${ZORVIX_SYSTEM_PROMPT}\n\nYou are an exceptional technical educator with the teaching ability of a great professor combined with the depth of a senior engineer. You:
- Meet learners exactly at their level — never talk down, never overwhelm
- Use concrete examples, real code, and relatable analogies
- Make complex ideas simple without making them wrong
- Show the WHY before the HOW
- Use visual explanations (ASCII diagrams, tables) when helpful
- Are encouraging and make learning feel achievable
- Reference real-world applications to make theory practical`;

// ── Concept Explainer ─────────────────────────────────────────────────────────

router.post("/api/teach/concept", async (req: Request, res: Response): Promise<void> => {
  const { concept, level, language, analogyDomain, stream: wantStream } = req.body as {
    concept: string;
    level?: "beginner" | "intermediate" | "advanced";
    language?: string;
    analogyDomain?: string;
    stream?: boolean;
  };

  if (!concept) { res.status(400).json({ error: "concept is required" }); return; }

  const levelMap = {
    beginner: "someone who is just starting programming. Explain like I'm 12 years old. Use everyday analogies. Avoid jargon. Keep code examples super simple.",
    intermediate: "a developer who knows the basics and has written some code, but is new to this specific concept. Use some technical terms but explain them.",
    advanced: "an experienced developer who wants deep technical understanding. Be precise, cover edge cases and implementation details, compare with alternatives.",
  };

  const levelDescription = levelMap[level ?? "intermediate"];

  const prompt = `Explain "${concept}" to ${levelDescription}

${language ? `Use ${language} for all code examples.` : ""}
${analogyDomain ? `Use analogies from: ${analogyDomain}` : ""}

Structure your explanation:

## The Core Idea
(One or two sentences that capture the essence — no jargon)

## Why It Matters
(What problem does it solve? Why should I care?)

## How It Works
(Step-by-step explanation with ASCII diagrams where helpful)

## The Simplest Example
\`\`\`${language ?? "javascript"}
// Minimal working example that shows just this concept
\`\`\`

## A Real-World Example
\`\`\`${language ?? "javascript"}
// Production-style usage you'd actually see
\`\`\`

## Common Mistakes
(The 3 most common misunderstandings or errors — with corrections)

## Mental Model
(One memorable analogy or mental model to remember this forever)

## What to Learn Next
(3 concepts that naturally follow from this one)`;

  if (wantStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const stream = await createChatCompletionStream({
        messages: [
          { role: "system", content: TEACHER_SYSTEM },
          { role: "user", content: prompt },
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
          { role: "system", content: TEACHER_SYSTEM },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 60000,
      });
      res.json({ explanation: result.choices[0]?.message?.content ?? "" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Quiz Generator ────────────────────────────────────────────────────────────

router.post("/api/teach/quiz", async (req: Request, res: Response): Promise<void> => {
  const { topic, level, questionCount, questionTypes } = req.body as {
    topic: string;
    level?: "beginner" | "intermediate" | "advanced";
    questionCount?: number;
    questionTypes?: ("multiple_choice" | "code_completion" | "true_false" | "short_answer")[];
  };

  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  const count = Math.min(questionCount ?? 10, 20);
  const types = questionTypes ?? ["multiple_choice", "code_completion", "true_false"];
  const typesList = types.join(", ");

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: TEACHER_SYSTEM },
        {
          role: "user",
          content: `Generate ${count} quiz questions about "${topic}" at ${level ?? "intermediate"} level.

Use these question types: ${typesList}

For each question provide:
1. The question text
2. For multiple choice: 4 options (A, B, C, D) with one correct
3. For code completion: code with blank(s) to fill in
4. For true/false: statement + brief explanation
5. For short answer: expected key points in the answer
6. The correct answer
7. A brief explanation of WHY it's correct
8. The concept being tested

Format as JSON array:
[
  {
    "id": 1,
    "type": "multiple_choice",
    "question": "...",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "correct": "A",
    "explanation": "...",
    "concept": "..."
  },
  ...
]`,
        },
      ],
      max_completion_tokens: 60000,
    });

    const raw = result.choices[0]?.message?.content ?? "[]";
    let questions;
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      questions = [];
    }

    res.json({ questions, topic, level: level ?? "intermediate", count: questions.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Learning Roadmap Generator ────────────────────────────────────────────────

router.post("/api/teach/roadmap", async (req: Request, res: Response): Promise<void> => {
  const { goal, currentSkills, timeAvailable, learningStyle } = req.body as {
    goal: string;
    currentSkills?: string;
    timeAvailable?: string;
    learningStyle?: "reading" | "videos" | "projects" | "mixed";
  };

  if (!goal) { res.status(400).json({ error: "goal is required" }); return; }

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: TEACHER_SYSTEM },
        {
          role: "user",
          content: `Create a detailed learning roadmap to achieve: ${goal}

Current skills: ${currentSkills ?? "beginner programmer"}
Time available: ${timeAvailable ?? "10 hours per week"}
Learning style: ${learningStyle ?? "mixed"} (reading, videos, and projects)

Create a comprehensive learning roadmap:

## Learning Goal Assessment
(What exactly needs to be learned, skill gaps analysis)

## Roadmap Overview (Visual)
\`\`\`
[ASCII timeline/tree showing the learning path]
\`\`\`

## Phase 1: Foundation (Week 1-4)
For each topic:
- What to learn
- Why this comes first
- Estimated time
- Key resources (books, docs, courses)
- Mini project to solidify learning
- How to know you've mastered it

## Phase 2: Core Skills (Week 5-10)
[Same format as Phase 1]

## Phase 3: Advanced Topics (Week 11-16)
[Same format as Phase 1]

## Phase 4: Real-World Projects (Week 17-20)
(3 portfolio projects with increasing complexity)

## Milestone Checklist
□ Week 2: [specific skill]
□ Week 4: [specific skill]
[etc.]

## Common Pitfalls on This Path
(What most people do wrong when learning this)

## Communities & Resources
(Forums, Discord servers, newsletters, YouTube channels)

## How to Measure Progress
(Specific metrics: can build X, solved Y problems, etc.)`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ roadmap: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Technology Comparison ─────────────────────────────────────────────────────

router.post("/api/teach/compare", async (req: Request, res: Response): Promise<void> => {
  const { itemA, itemB, context, criteria } = req.body as {
    itemA: string;
    itemB: string;
    context?: string;
    criteria?: string[];
  };

  if (!itemA || !itemB) { res.status(400).json({ error: "itemA and itemB are required" }); return; }

  const criteriaList = criteria ?? [
    "Performance", "Learning curve", "Ecosystem/community", "Use cases",
    "Developer experience", "Production readiness", "Scalability",
  ];

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: TEACHER_SYSTEM },
        {
          role: "user",
          content: `Compare ${itemA} vs ${itemB} ${context ? `in the context of: ${context}` : ""}

## Side-by-Side Comparison Table
| Criteria | ${itemA} | ${itemB} |
|----------|----------|----------|
${criteriaList.map(c => `| ${c} | ... | ... |`).join("\n")}

## ${itemA} — Deep Dive
Strengths:
Weaknesses:
Best for:
Real example code:

## ${itemB} — Deep Dive
Strengths:
Weaknesses:
Best for:
Real example code:

## Head-to-Head on Key Dimensions

### Syntax & Ergonomics
(Code comparison doing the same thing)

### Performance Characteristics
(Benchmarks, tradeoffs)

### Ecosystem & Tooling
(Libraries, community size, job market)

## Decision Framework
Choose ${itemA} when:
- [condition 1]
- [condition 2]

Choose ${itemB} when:
- [condition 1]
- [condition 2]

## The Honest Verdict
(What you'd actually recommend and why, without politics)`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ comparison: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cheatsheet Generator ──────────────────────────────────────────────────────

router.post("/api/teach/cheatsheet", async (req: Request, res: Response): Promise<void> => {
  const { topic, language, includeExamples } = req.body as {
    topic: string;
    language?: string;
    includeExamples?: boolean;
  };

  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: TEACHER_SYSTEM },
        {
          role: "user",
          content: `Create a comprehensive, well-organized cheatsheet for: ${topic}
${language ? `Language: ${language}` : ""}

Make it the kind of cheatsheet a developer bookmarks and uses daily.

Include:
1. Quick reference table of all key concepts/commands/syntax
2. ${includeExamples !== false ? "Code examples for each important item" : "Brief descriptions"}
3. Common patterns and idioms
4. Gotchas and edge cases to remember
5. Quick decision tree (if/then rules)
6. Most common operations grouped logically

Format it with clear sections, use code blocks for all code, use tables for comparisons.
Make it dense but scannable — this is a reference, not a tutorial.`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ cheatsheet: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Interview Prep Generator ──────────────────────────────────────────────────

router.post("/api/teach/interview", async (req: Request, res: Response): Promise<void> => {
  const { role, level, technologies, type } = req.body as {
    role: string;
    level?: "junior" | "mid" | "senior" | "staff";
    technologies?: string[];
    type?: "technical" | "behavioral" | "system-design" | "all";
  };

  if (!role) { res.status(400).json({ error: "role is required" }); return; }

  const interviewType = type ?? "all";
  const techList = technologies?.join(", ") ?? "general";

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: TEACHER_SYSTEM },
        {
          role: "user",
          content: `Generate comprehensive interview prep for: ${role} (${level ?? "mid"} level)
Technologies: ${techList}
Interview type: ${interviewType}

Provide:

${interviewType === "all" || interviewType === "technical" ? `## Technical Questions (10 questions)
For each: question + ideal answer + what the interviewer is really testing` : ""}

${interviewType === "all" || interviewType === "behavioral" ? `## Behavioral Questions (5 questions)
Use STAR format. Include ideal answer structure.` : ""}

${interviewType === "all" || interviewType === "system-design" ? `## System Design Questions (3 questions)
With approach framework and what to demonstrate` : ""}

## Coding Challenges
5 representative coding problems with solutions and time complexity

## Questions to Ask the Interviewer
10 smart questions that demonstrate seniority and genuine interest

## Red Flags to Avoid
Common mistakes candidates make at this level

## Preparation Checklist
What to study in the week before the interview`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ prep: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Project Ideas Generator ───────────────────────────────────────────────────

router.post("/api/teach/project-ideas", async (req: Request, res: Response): Promise<void> => {
  const { skills, level, interests, timeAvailable } = req.body as {
    skills: string;
    level?: "beginner" | "intermediate" | "advanced";
    interests?: string;
    timeAvailable?: string;
  };

  if (!skills) { res.status(400).json({ error: "skills are required" }); return; }

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: TEACHER_SYSTEM },
        {
          role: "user",
          content: `Suggest learning projects for someone with these skills: ${skills}
Level: ${level ?? "intermediate"}
Interests: ${interests ?? "any domain"}
Available time: ${timeAvailable ?? "weekends"}

Generate 8 project ideas at increasing complexity:

For each project:
## Project N: [Name]
**Difficulty**: [1-5 stars]
**Time to complete**: [estimate]
**What you'll learn**: [specific skills]
**Description**: [what it does]
**Core features to build**:
- [feature 1]
- [feature 2]
**Tech stack**: [specific technologies]
**Stretch goals**: [to make it even better]
**Portfolio value**: [what this demonstrates to employers]
**Getting started**: [first 3 steps to begin]

Range from easy wins (builds confidence) to impressive portfolio pieces.`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ projects: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
