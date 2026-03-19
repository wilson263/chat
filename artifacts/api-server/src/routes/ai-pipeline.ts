/**
 * AI Pipeline System for ZorvixAI
 *
 * Chain multiple AI operations together for complex multi-step tasks.
 *
 * Endpoints:
 *   POST /api/pipeline/run         — Run a named pipeline
 *   POST /api/pipeline/compose     — Compose a custom pipeline on the fly
 *   GET  /api/pipeline/list        — List available pipelines
 *   POST /api/pipeline/code-ship   — Full code pipeline: write→test→document→review
 *   POST /api/pipeline/data-story  — Data analysis pipeline: analyze→insights→visualize
 *   POST /api/pipeline/content     — Content pipeline: outline→draft→edit→seo
 */

import { Router, type Request, type Response } from "express";
import { createChatCompletion } from "../lib/ai";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

const router = Router();

// ── Pipeline Step Types ───────────────────────────────────────────────────────

type StepInput = "user_input" | "previous_output" | "combined";

interface PipelineStepDefinition {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  buildUserPrompt: (input: string, context: Record<string, string>) => string;
  inputSource: StepInput;
  maxTokens?: number;
}

interface PipelineDefinition {
  id: string;
  name: string;
  description: string;
  steps: PipelineStepDefinition[];
  inputDescription: string;
  outputDescription: string;
}

interface PipelineRunResult {
  pipelineId: string;
  steps: Array<{
    id: string;
    name: string;
    input: string;
    output: string;
    durationMs: number;
  }>;
  finalOutput: string;
  totalDurationMs: number;
}

// ── Pipeline Executor ─────────────────────────────────────────────────────────

async function runPipelineStep(
  step: PipelineStepDefinition,
  input: string,
  context: Record<string, string>
): Promise<string> {
  const userPrompt = step.buildUserPrompt(input, context);

  const result = await createChatCompletion({
    messages: [
      { role: "system", content: `${ZORVIX_SYSTEM_PROMPT}\n\n${step.systemPrompt}` },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: step.maxTokens ?? 60000,
  });

  return result.choices[0]?.message?.content ?? "";
}

async function executePipeline(
  pipeline: PipelineDefinition,
  userInput: string,
  onStepComplete?: (stepId: string, output: string) => void
): Promise<PipelineRunResult> {
  const startTime = Date.now();
  const stepResults: PipelineRunResult["steps"] = [];
  const context: Record<string, string> = { user_input: userInput };

  let previousOutput = userInput;

  for (const step of pipeline.steps) {
    const stepStart = Date.now();

    const input =
      step.inputSource === "user_input" ? userInput :
      step.inputSource === "previous_output" ? previousOutput :
      `Original request: ${userInput}\n\nPrevious step output: ${previousOutput}`;

    const output = await runPipelineStep(step, input, context);
    const durationMs = Date.now() - stepStart;

    context[step.id] = output;
    previousOutput = output;

    stepResults.push({ id: step.id, name: step.name, input: input.slice(0, 500), output, durationMs });

    onStepComplete?.(step.id, output);
  }

  return {
    pipelineId: pipeline.id,
    steps: stepResults,
    finalOutput: previousOutput,
    totalDurationMs: Date.now() - startTime,
  };
}

// ── Built-in Pipelines ────────────────────────────────────────────────────────

const CODE_SHIP_PIPELINE: PipelineDefinition = {
  id: "code-ship",
  name: "Code Ship Pipeline",
  description: "Takes a requirement and produces: implementation → tests → docs → reviewed code",
  inputDescription: "A feature or function requirement",
  outputDescription: "Complete implementation with tests, documentation, and code review",
  steps: [
    {
      id: "implement",
      name: "Implementation",
      description: "Write the initial implementation",
      inputSource: "user_input",
      systemPrompt: "You are a senior engineer. Write complete, production-ready code with no placeholders.",
      buildUserPrompt: (input) =>
        `Implement this feature completely:\n${input}\n\nWrite complete, production-ready code. Every function must be fully implemented.`,
      maxTokens: 100000,
    },
    {
      id: "test",
      name: "Test Generation",
      description: "Generate comprehensive tests",
      inputSource: "previous_output",
      systemPrompt: "You are a QA engineer specializing in comprehensive test coverage.",
      buildUserPrompt: (impl, ctx) =>
        `Write comprehensive tests for this implementation:\n\`\`\`\n${impl}\n\`\`\`\n\nOriginal requirement: ${ctx.user_input}\n\nCover:\n- Happy path\n- Edge cases\n- Error cases\n- Boundary conditions`,
      maxTokens: 100000,
    },
    {
      id: "document",
      name: "Documentation",
      description: "Generate JSDoc/documentation",
      inputSource: "combined",
      systemPrompt: "You are a technical writer creating clear, useful documentation.",
      buildUserPrompt: (_, ctx) =>
        `Generate complete documentation for:\n\nImplementation:\n${ctx.implement?.slice(0, 2000)}\n\nInclude:\n- Module/file overview\n- JSDoc for every function\n- Usage examples\n- Parameter descriptions\n- Return type documentation\n- Error conditions`,
      maxTokens: 100000,
    },
    {
      id: "review",
      name: "Final Code Review",
      description: "Senior engineer final review",
      inputSource: "combined",
      systemPrompt: "You are a principal engineer doing a final code review before shipping.",
      buildUserPrompt: (_, ctx) =>
        `Final review before shipping:\n\nCode:\n${ctx.implement?.slice(0, 2000)}\n\nTests:\n${ctx.test?.slice(0, 1000)}\n\nCheck: correctness, security, performance, completeness.\nList any issues found and provide the final approved or corrected code.`,
      maxTokens: 100000,
    },
  ],
};

const DATA_STORY_PIPELINE: PipelineDefinition = {
  id: "data-story",
  name: "Data Story Pipeline",
  description: "Transforms raw data description into analysis, insights, and visualization recommendations",
  inputDescription: "A dataset description or data snippet",
  outputDescription: "Analysis, insights, narrative, and visualization recommendations",
  steps: [
    {
      id: "analyze",
      name: "Data Analysis",
      description: "Analyze the dataset structure and content",
      inputSource: "user_input",
      systemPrompt: "You are a data scientist with deep expertise in statistical analysis.",
      buildUserPrompt: (input) =>
        `Analyze this data:\n${input}\n\nProvide:\n1. Dataset overview (size, types, structure)\n2. Key statistics (mean, median, distribution)\n3. Data quality issues (nulls, outliers, inconsistencies)\n4. Variable relationships\n5. Initial observations`,
    },
    {
      id: "insights",
      name: "Insight Extraction",
      description: "Extract business insights from analysis",
      inputSource: "previous_output",
      systemPrompt: "You are a business intelligence analyst who translates data patterns into business insights.",
      buildUserPrompt: (analysis, ctx) =>
        `Based on this analysis:\n${analysis}\n\nOriginal data context: ${ctx.user_input?.slice(0, 200)}\n\nExtract actionable business insights:\n1. Top 5 insights (ranked by business impact)\n2. Unexpected findings\n3. Trends and patterns\n4. Actionable recommendations\n5. Risks and concerns identified`,
    },
    {
      id: "visualize",
      name: "Visualization Plan",
      description: "Recommend the best visualizations",
      inputSource: "combined",
      systemPrompt: "You are a data visualization expert who knows exactly which chart type best reveals each insight.",
      buildUserPrompt: (_, ctx) =>
        `Recommend visualizations for:\n\nAnalysis: ${ctx.analyze?.slice(0, 800)}\nInsights: ${ctx.insights?.slice(0, 800)}\n\nFor each visualization:\n- Chart type (bar, line, scatter, heatmap, etc.)\n- X/Y axes and what data maps to them\n- Why this chart best shows this insight\n- Key labels and annotations needed\n- Sample data for the chart`,
    },
    {
      id: "narrative",
      name: "Data Narrative",
      description: "Write the data story",
      inputSource: "combined",
      systemPrompt: "You are a data storyteller who makes numbers meaningful to non-technical stakeholders.",
      buildUserPrompt: (_, ctx) =>
        `Write a compelling data narrative for non-technical stakeholders.\n\nInsights: ${ctx.insights?.slice(0, 800)}\nVisualizations: ${ctx.visualize?.slice(0, 500)}\n\nWrite:\n- Executive summary (3 sentences)\n- The full story (engaging narrative with insights woven in)\n- Recommendations (specific, actionable)\n- Next steps`,
    },
  ],
};

const CONTENT_PIPELINE: PipelineDefinition = {
  id: "content",
  name: "Content Creation Pipeline",
  description: "From topic to polished, SEO-optimized content",
  inputDescription: "A content topic, target audience, and goal",
  outputDescription: "Research, outline, draft, edited content, and SEO recommendations",
  steps: [
    {
      id: "research",
      name: "Topic Research",
      description: "Research the topic comprehensively",
      inputSource: "user_input",
      systemPrompt: "You are an expert content researcher who thoroughly understands any topic.",
      buildUserPrompt: (input) =>
        `Research this topic for content creation:\n${input}\n\nProvide:\n1. Key concepts and terminology\n2. Main arguments and perspectives\n3. Interesting angles and hooks\n4. Supporting facts and statistics\n5. Common questions people have\n6. Common misconceptions to address`,
    },
    {
      id: "outline",
      name: "Content Outline",
      description: "Create a detailed content outline",
      inputSource: "combined",
      systemPrompt: "You are a content strategist who creates engaging content structures.",
      buildUserPrompt: (research, ctx) =>
        `Create a detailed content outline for:\n${ctx.user_input}\n\nBased on research:\n${research?.slice(0, 1000)}\n\nCreate:\n1. Compelling headline options (5 variations)\n2. Introduction hook\n3. Main sections with subpoints\n4. Key takeaways\n5. Call to action\n6. Estimated read time`,
    },
    {
      id: "draft",
      name: "Content Draft",
      description: "Write the full content draft",
      inputSource: "combined",
      systemPrompt: "You are an expert content writer who creates engaging, valuable content.",
      buildUserPrompt: (_, ctx) =>
        `Write a complete, high-quality content piece using:\n\nTopic: ${ctx.user_input?.slice(0, 200)}\nOutline: ${ctx.outline?.slice(0, 800)}\nResearch: ${ctx.research?.slice(0, 600)}\n\nWrite the full draft — engaging, informative, and valuable to the reader.`,
      maxTokens: 100000,
    },
    {
      id: "seo",
      name: "SEO Optimization",
      description: "Add SEO recommendations",
      inputSource: "combined",
      systemPrompt: "You are an SEO expert who optimizes content for search engines without sacrificing quality.",
      buildUserPrompt: (_, ctx) =>
        `Provide SEO optimization for:\n\nContent draft: ${ctx.draft?.slice(0, 1500)}\nTopic: ${ctx.user_input?.slice(0, 200)}\n\nProvide:\n1. Primary keyword and 5 secondary keywords\n2. Meta title (< 60 chars)\n3. Meta description (< 160 chars)\n4. Suggested internal link opportunities\n5. Suggested header improvements for SEO\n6. Schema markup recommendations\n7. Content gap analysis (what's missing for ranking)`,
    },
  ],
};

const PIPELINES: Record<string, PipelineDefinition> = {
  "code-ship": CODE_SHIP_PIPELINE,
  "data-story": DATA_STORY_PIPELINE,
  "content": CONTENT_PIPELINE,
};

// ── List Pipelines ────────────────────────────────────────────────────────────

router.get("/api/pipeline/list", (_req: Request, res: Response): void => {
  const list = Object.values(PIPELINES).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    inputDescription: p.inputDescription,
    outputDescription: p.outputDescription,
    stepCount: p.steps.length,
    steps: p.steps.map(s => ({ id: s.id, name: s.name, description: s.description })),
  }));
  res.json({ pipelines: list });
});

// ── Run Named Pipeline ────────────────────────────────────────────────────────

router.post("/api/pipeline/run", async (req: Request, res: Response): Promise<void> => {
  const { pipelineId, input, stream: wantStream } = req.body as {
    pipelineId: string;
    input: string;
    stream?: boolean;
  };

  if (!pipelineId || !input) {
    res.status(400).json({ error: "pipelineId and input are required" });
    return;
  }

  const pipeline = PIPELINES[pipelineId];
  if (!pipeline) {
    res.status(404).json({ error: `Pipeline "${pipelineId}" not found. Available: ${Object.keys(PIPELINES).join(", ")}` });
    return;
  }

  if (wantStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    send({ event: "started", pipelineId, stepCount: pipeline.steps.length });

    try {
      const result = await executePipeline(pipeline, input, (stepId, output) => {
        send({ event: "step_complete", stepId, outputPreview: output.slice(0, 200) });
      });

      send({ event: "complete", result });
    } catch (err: any) {
      send({ event: "error", error: err.message });
    }
    res.end();
  } else {
    try {
      const result = await executePipeline(pipeline, input);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Code Ship Shorthand ───────────────────────────────────────────────────────

router.post("/api/pipeline/code-ship", async (req: Request, res: Response): Promise<void> => {
  const { requirement, language, stream } = req.body as {
    requirement: string;
    language?: string;
    stream?: boolean;
  };

  if (!requirement) { res.status(400).json({ error: "requirement is required" }); return; }
  req.body.pipelineId = "code-ship";
  req.body.input = `${requirement}${language ? `\nLanguage: ${language}` : ""}`;
  req.body.stream = stream;

  const pipeline = PIPELINES["code-ship"];

  if (stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    send({ event: "started" });
    try {
      const result = await executePipeline(pipeline, req.body.input, (stepId, output) => {
        send({ event: "step_complete", stepId, outputPreview: output.slice(0, 300) });
      });
      send({ event: "complete", result });
    } catch (err: any) {
      send({ event: "error", error: err.message });
    }
    res.end();
  } else {
    try {
      const result = await executePipeline(pipeline, req.body.input);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Data Story Shorthand ──────────────────────────────────────────────────────

router.post("/api/pipeline/data-story", async (req: Request, res: Response): Promise<void> => {
  const { data, context } = req.body as { data: string; context?: string };
  if (!data) { res.status(400).json({ error: "data is required" }); return; }

  try {
    const result = await executePipeline(
      PIPELINES["data-story"],
      `${data}${context ? `\nContext: ${context}` : ""}`
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Content Pipeline Shorthand ────────────────────────────────────────────────

router.post("/api/pipeline/content", async (req: Request, res: Response): Promise<void> => {
  const { topic, audience, goal, contentType } = req.body as {
    topic: string;
    audience?: string;
    goal?: string;
    contentType?: string;
  };

  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  const input = `Topic: ${topic}\nAudience: ${audience ?? "general technical audience"}\nGoal: ${goal ?? "educate and inform"}\nContent type: ${contentType ?? "blog post"}`;

  try {
    const result = await executePipeline(PIPELINES["content"], input);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Compose Custom Pipeline ───────────────────────────────────────────────────

router.post("/api/pipeline/compose", async (req: Request, res: Response): Promise<void> => {
  const { input, steps } = req.body as {
    input: string;
    steps: Array<{
      name: string;
      systemPrompt: string;
      instruction: string;
      useFullContext?: boolean;
    }>;
  };

  if (!input || !steps?.length) {
    res.status(400).json({ error: "input and steps array are required" });
    return;
  }

  if (steps.length > 8) {
    res.status(400).json({ error: "Maximum 8 steps allowed in a custom pipeline" });
    return;
  }

  const customPipeline: PipelineDefinition = {
    id: "custom",
    name: "Custom Pipeline",
    description: "User-composed pipeline",
    inputDescription: "Custom input",
    outputDescription: "Custom output",
    steps: steps.map((s, i) => ({
      id: `step_${i}`,
      name: s.name,
      description: s.name,
      inputSource: (s.useFullContext ? "combined" : i === 0 ? "user_input" : "previous_output") as StepInput,
      systemPrompt: s.systemPrompt,
      buildUserPrompt: (stepInput: string, ctx: Record<string, string>) => {
        if (s.useFullContext) {
          const contextSummary = Object.entries(ctx)
            .filter(([k]) => k !== "user_input")
            .map(([k, v]) => `${k}: ${v.slice(0, 500)}`)
            .join("\n\n");
          return `${s.instruction}\n\nOriginal input: ${ctx.user_input}\n\nPrevious steps:\n${contextSummary}`;
        }
        return `${s.instruction}\n\n${stepInput}`;
      },
    })),
  };

  try {
    const result = await executePipeline(customPipeline, input);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
