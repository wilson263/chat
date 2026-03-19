/**
 * Multi-Agent System for ZorvixAI
 *
 * Orchestrates multiple specialized AI agents working together:
 *
 * POST /api/agents/build    — Full app builder: Planner → Architect → Coder → Reviewer
 * POST /api/agents/research — Research pipeline: Researcher → Analyst → Writer
 * POST /api/agents/solve    — Problem solver: Understander → Strategist → Implementer → Verifier
 * POST /api/agents/audit    — Full codebase audit: Analyzer → Security → Performance → Reporter
 * GET  /api/agents/status/:jobId — Poll status of a running agent job
 */

import { Router, type Request, type Response } from "express";
import {
  createChatCompletion,
  createChatCompletionStream,
  AGENT_BUILD_MODELS,
  PLANNING_MODELS,
} from "../lib/ai";
import { createChatCompletionStreamFromList } from "../lib/ai";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

const router = Router();

// ── In-Memory Job Store ───────────────────────────────────────────────────────

interface AgentJob {
  id: string;
  type: string;
  status: "queued" | "running" | "complete" | "failed";
  steps: AgentStep[];
  currentStep: number;
  result: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

interface AgentStep {
  name: string;
  agentRole: string;
  status: "pending" | "running" | "complete" | "failed";
  output: string;
  startedAt?: number;
  completedAt?: number;
  tokensUsed?: number;
}

const activeJobs = new Map<string, AgentJob>();

function createJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getJob(id: string): AgentJob | undefined {
  return activeJobs.get(id);
}

// ── Agent Runner ──────────────────────────────────────────────────────────────

interface AgentConfig {
  name: string;
  role: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  models?: string[];
}

async function runAgent(config: AgentConfig): Promise<string> {
  const models = config.models ?? AGENT_BUILD_MODELS;

  try {
    const { stream } = await createChatCompletionStreamFromList(
      {
        messages: [
          { role: "system", content: `${ZORVIX_SYSTEM_PROMPT}\n\n${config.systemPrompt}` },
          { role: "user", content: config.userPrompt },
        ],
        max_completion_tokens: config.maxTokens ?? 60000,
      },
      models
    );

    let output = "";
    for await (const chunk of stream) {
      output += chunk.choices[0]?.delta?.content ?? "";
    }
    return output;
  } catch {
    const result = await createChatCompletion(
      {
        messages: [
          { role: "system", content: `${ZORVIX_SYSTEM_PROMPT}\n\n${config.systemPrompt}` },
          { role: "user", content: config.userPrompt },
        ],
        max_completion_tokens: config.maxTokens ?? 60000,
      }
    );
    return result.choices[0]?.message?.content ?? "";
  }
}

// ── Status Endpoint ───────────────────────────────────────────────────────────

router.get("/api/agents/status/:jobId", (req: Request, res: Response): void => {
  const job = getJob(req.params.jobId);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  res.json({
    id: job.id,
    type: job.type,
    status: job.status,
    currentStep: job.currentStep,
    totalSteps: job.steps.length,
    steps: job.steps.map(s => ({
      name: s.name,
      agentRole: s.agentRole,
      status: s.status,
      outputPreview: s.output.slice(0, 200),
      tokensUsed: s.tokensUsed,
    })),
    result: job.result,
    error: job.error,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    elapsedMs: job.completedAt
      ? job.completedAt - job.startedAt
      : Date.now() - job.startedAt,
  });
});

// ── Full App Builder Pipeline ─────────────────────────────────────────────────

router.post("/api/agents/build", async (req: Request, res: Response): Promise<void> => {
  const { requirement, techStack, stream: wantStream } = req.body as {
    requirement: string;
    techStack?: string;
    stream?: boolean;
  };

  if (!requirement) { res.status(400).json({ error: "requirement is required" }); return; }

  const jobId = createJobId();
  const job: AgentJob = {
    id: jobId,
    type: "build",
    status: "queued",
    steps: [
      { name: "Planning", agentRole: "Product Manager", status: "pending", output: "" },
      { name: "Architecture", agentRole: "Software Architect", status: "pending", output: "" },
      { name: "Implementation", agentRole: "Senior Engineer", status: "pending", output: "" },
      { name: "Code Review", agentRole: "Code Reviewer", status: "pending", output: "" },
    ],
    currentStep: 0,
    result: "",
    startedAt: Date.now(),
  };

  activeJobs.set(jobId, job);

  if (wantStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ jobId, event: "started" })}\n\n`);

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      job.status = "running";

      // Step 1: Planning
      job.steps[0].status = "running";
      job.steps[0].startedAt = Date.now();
      send({ event: "step_start", step: "Planning", stepIndex: 0 });

      const planOutput = await runAgent({
        name: "Planner",
        role: "Product Manager",
        systemPrompt: "You are a senior product manager. You create clear, actionable development plans with user stories, acceptance criteria, and implementation scope.",
        userPrompt: `Create a detailed development plan for:\n${requirement}\n\nTech stack preference: ${techStack ?? "modern TypeScript/React"}\n\nProvide:\n1. Project overview and goals\n2. User stories (as a [user] I want [goal] so that [benefit])\n3. Feature list (MVP scope vs nice-to-have)\n4. Technical requirements\n5. Data models needed\n6. API endpoints needed\n7. Success criteria`,
        maxTokens: 60000,
        models: PLANNING_MODELS,
      });

      job.steps[0].output = planOutput;
      job.steps[0].status = "complete";
      job.steps[0].completedAt = Date.now();
      job.currentStep = 1;
      send({ event: "step_complete", step: "Planning", stepIndex: 0, outputPreview: planOutput.slice(0, 300) });

      // Step 2: Architecture
      job.steps[1].status = "running";
      job.steps[1].startedAt = Date.now();
      send({ event: "step_start", step: "Architecture", stepIndex: 1 });

      const archOutput = await runAgent({
        name: "Architect",
        role: "Software Architect",
        systemPrompt: "You are a software architect specializing in modern web applications. You design clean, scalable architectures with clear component boundaries.",
        userPrompt: `Based on this plan:\n\n${planOutput}\n\nDesign the technical architecture:\n1. Component/module structure\n2. Database schema (tables and relationships)\n3. API contract (endpoints, request/response shapes)\n4. State management approach\n5. Authentication/authorization design\n6. File structure\n7. Key technical decisions and trade-offs`,
        maxTokens: 60000,
      });

      job.steps[1].output = archOutput;
      job.steps[1].status = "complete";
      job.steps[1].completedAt = Date.now();
      job.currentStep = 2;
      send({ event: "step_complete", step: "Architecture", stepIndex: 1, outputPreview: archOutput.slice(0, 300) });

      // Step 3: Implementation
      job.steps[2].status = "running";
      job.steps[2].startedAt = Date.now();
      send({ event: "step_start", step: "Implementation", stepIndex: 2 });

      const implOutput = await runAgent({
        name: "Engineer",
        role: "Senior Engineer",
        systemPrompt: "You are a senior full-stack engineer. You write complete, production-ready code using best practices. Every file you output is complete — no TODOs, no placeholders.",
        userPrompt: `Implement the following system:\n\nRequirement:\n${requirement}\n\nPlan:\n${planOutput.slice(0, 1000)}\n\nArchitecture:\n${archOutput.slice(0, 1000)}\n\nWrite COMPLETE, production-ready code using ${techStack ?? "TypeScript/React"}:\n- All files should be fully implemented\n- Include error handling\n- Follow the architecture design\n- Use ===FILE: path/filename.ext=== format for each file`,
        maxTokens: 60000,
      });

      job.steps[2].output = implOutput;
      job.steps[2].status = "complete";
      job.steps[2].completedAt = Date.now();
      job.currentStep = 3;
      send({ event: "step_complete", step: "Implementation", stepIndex: 2, outputPreview: implOutput.slice(0, 300) });

      // Step 4: Code Review
      job.steps[3].status = "running";
      job.steps[3].startedAt = Date.now();
      send({ event: "step_start", step: "Code Review", stepIndex: 3 });

      const reviewOutput = await runAgent({
        name: "Reviewer",
        role: "Code Reviewer",
        systemPrompt: "You are a principal engineer doing a final code review. You catch bugs, security issues, and suggest improvements. You are thorough but constructive.",
        userPrompt: `Review this implementation:\n\n${implOutput.slice(0, 3000)}\n\nCheck for:\n1. Bugs and logic errors\n2. Security vulnerabilities\n3. Missing error handling\n4. Performance issues\n5. Missing edge cases\n\nProvide: summary of findings + corrected code for any critical issues`,
        maxTokens: 60000,
        models: PLANNING_MODELS,
      });

      job.steps[3].output = reviewOutput;
      job.steps[3].status = "complete";
      job.steps[3].completedAt = Date.now();
      job.currentStep = 4;
      send({ event: "step_complete", step: "Code Review", stepIndex: 3, outputPreview: reviewOutput.slice(0, 200) });

      // Compile final result
      job.result = `# Build Complete

## Plan
${planOutput}

## Architecture  
${archOutput}

## Implementation
${implOutput}

## Code Review Notes
${reviewOutput}`;

      job.status = "complete";
      job.completedAt = Date.now();
      send({ event: "complete", jobId, totalMs: job.completedAt - job.startedAt });
    } catch (err: any) {
      job.status = "failed";
      job.error = err.message;
      job.completedAt = Date.now();
      send({ event: "error", error: err.message });
    }

    res.end();
  } else {
    res.json({ jobId, message: "Job started. Poll /api/agents/status/" + jobId + " for updates." });

    // Run in background
    setImmediate(async () => {
      try {
        job.status = "running";

        job.steps[0].status = "running";
        job.steps[0].output = await runAgent({
          name: "Planner", role: "PM",
          systemPrompt: "You are a senior PM creating development plans.",
          userPrompt: `Plan this: ${requirement}`,
          models: PLANNING_MODELS,
        });
        job.steps[0].status = "complete";
        job.currentStep = 1;

        job.steps[1].status = "running";
        job.steps[1].output = await runAgent({
          name: "Architect", role: "Architect",
          systemPrompt: "You are a software architect.",
          userPrompt: `Design architecture for: ${requirement}\n\nPlan: ${job.steps[0].output.slice(0, 500)}`,
        });
        job.steps[1].status = "complete";
        job.currentStep = 2;

        job.steps[2].status = "running";
        job.steps[2].output = await runAgent({
          name: "Engineer", role: "Engineer",
          systemPrompt: "You are a senior engineer writing complete production code.",
          userPrompt: `Implement: ${requirement}\nPlan: ${job.steps[0].output.slice(0, 500)}\nArch: ${job.steps[1].output.slice(0, 500)}`,
        });
        job.steps[2].status = "complete";
        job.currentStep = 3;

        job.steps[3].status = "running";
        job.steps[3].output = await runAgent({
          name: "Reviewer", role: "Reviewer",
          systemPrompt: "You are a code reviewer.",
          userPrompt: `Review: ${job.steps[2].output.slice(0, 2000)}`,
          models: PLANNING_MODELS,
        });
        job.steps[3].status = "complete";
        job.currentStep = 4;

        job.result = [job.steps[0].output, job.steps[1].output, job.steps[2].output, job.steps[3].output].join("\n\n---\n\n");
        job.status = "complete";
        job.completedAt = Date.now();
      } catch (err: any) {
        job.status = "failed";
        job.error = err.message;
        job.completedAt = Date.now();
      }
    });
  }
});

// ── Research Pipeline ─────────────────────────────────────────────────────────

router.post("/api/agents/research", async (req: Request, res: Response): Promise<void> => {
  const { topic, depth } = req.body as { topic: string; depth?: "quick" | "thorough" };
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  send({ event: "started", topic });

  try {
    send({ event: "step_start", step: "Research" });
    const research = await runAgent({
      name: "Researcher", role: "Technical Researcher",
      systemPrompt: "You are a thorough technical researcher. You provide comprehensive, accurate information from your training knowledge.",
      userPrompt: `Research: ${topic}\n\nProvide:\n1. Overview and key concepts\n2. How it works (technical depth)\n3. Common use cases\n4. Pros and cons\n5. Best practices\n6. Common pitfalls\n7. Key tools and libraries\n8. Learning resources`,
      models: PLANNING_MODELS,
    });
    send({ event: "step_complete", step: "Research", outputPreview: research.slice(0, 200) });

    send({ event: "step_start", step: "Analysis" });
    const analysis = await runAgent({
      name: "Analyst", role: "Technical Analyst",
      systemPrompt: "You analyze technical information to extract insights and practical recommendations.",
      userPrompt: `Analyze this research and extract:\n- Key insights not immediately obvious\n- Practical implications for a developer\n- Decision framework (when to use, when not to)\n- Real-world examples\n\nResearch:\n${research.slice(0, 2000)}`,
      models: PLANNING_MODELS,
    });
    send({ event: "step_complete", step: "Analysis", outputPreview: analysis.slice(0, 200) });

    const finalReport = `# Research Report: ${topic}\n\n${research}\n\n## Analysis & Insights\n${analysis}`;
    send({ event: "complete", report: finalReport });
  } catch (err: any) {
    send({ event: "error", error: err.message });
  }

  res.end();
});

// ── Problem Solver Pipeline ───────────────────────────────────────────────────

router.post("/api/agents/solve", async (req: Request, res: Response): Promise<void> => {
  const { problem, constraints, codeContext } = req.body as {
    problem: string;
    constraints?: string;
    codeContext?: string;
  };

  if (!problem) { res.status(400).json({ error: "problem is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  send({ event: "started" });

  try {
    // Step 1: Understand the problem
    send({ event: "step_start", step: "Understanding" });
    const understanding = await runAgent({
      name: "Understander", role: "Problem Analyst",
      systemPrompt: "You deeply analyze problems to understand root causes, constraints, and success criteria.",
      userPrompt: `Analyze this problem deeply:\n${problem}\n${constraints ? `Constraints: ${constraints}` : ""}\n${codeContext ? `Code context:\n${codeContext}` : ""}\n\nIdentify:\n1. What is the actual problem (not just the symptom)?\n2. What constraints exist?\n3. What does a good solution look like?\n4. What approaches are NOT viable and why?`,
      models: PLANNING_MODELS,
    });
    send({ event: "step_complete", step: "Understanding" });

    // Step 2: Generate strategies
    send({ event: "step_start", step: "Strategy" });
    const strategy = await runAgent({
      name: "Strategist", role: "Solution Architect",
      systemPrompt: "You generate multiple solution strategies, analyze trade-offs, and select the best approach.",
      userPrompt: `For this problem:\n${problem}\n\nAnalysis:\n${understanding.slice(0, 800)}\n\nGenerate 3 different solution approaches. For each:\n- Strategy name and overview\n- How it solves the problem\n- Trade-offs\n- Implementation complexity\n\nThen recommend the BEST approach and explain why.`,
    });
    send({ event: "step_complete", step: "Strategy" });

    // Step 3: Implement the solution
    send({ event: "step_start", step: "Implementation" });
    const solution = await runAgent({
      name: "Implementer", role: "Senior Engineer",
      systemPrompt: "You implement solutions with complete, production-ready code. No placeholders.",
      userPrompt: `Implement the best solution for:\n${problem}\n\nStrategy:\n${strategy.slice(0, 800)}\n${codeContext ? `\nExisting code context:\n${codeContext}` : ""}\n\nProvide the complete implementation.`,
    });
    send({ event: "step_complete", step: "Implementation" });

    // Step 4: Verify
    send({ event: "step_start", step: "Verification" });
    const verification = await runAgent({
      name: "Verifier", role: "QA Engineer",
      systemPrompt: "You verify solutions by checking correctness, edge cases, and completeness.",
      userPrompt: `Verify this solution for the problem: ${problem.slice(0, 200)}\n\nSolution:\n${solution.slice(0, 2000)}\n\nCheck:\n1. Does it solve the original problem?\n2. Edge cases handled?\n3. Any remaining issues?\n4. What should be tested?`,
      models: PLANNING_MODELS,
    });
    send({ event: "step_complete", step: "Verification" });

    const finalSolution = `## Problem Analysis\n${understanding}\n\n## Solution Strategy\n${strategy}\n\n## Implementation\n${solution}\n\n## Verification\n${verification}`;
    send({ event: "complete", solution: finalSolution });
  } catch (err: any) {
    send({ event: "error", error: err.message });
  }

  res.end();
});

// ── Codebase Audit ────────────────────────────────────────────────────────────

router.post("/api/agents/audit", async (req: Request, res: Response): Promise<void> => {
  const { code, language, projectDescription } = req.body as {
    code: string;
    language?: string;
    projectDescription?: string;
  };

  if (!code) { res.status(400).json({ error: "code is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const lang = language ?? "unknown";
  send({ event: "started", language: lang });

  const codeSnippet = code.slice(0, 4000);

  try {
    const [qualityResult, securityResult, perfResult] = await Promise.allSettled([
      runAgent({
        name: "QualityAuditor", role: "Quality Engineer",
        systemPrompt: "You audit code quality: architecture, maintainability, readability, testing.",
        userPrompt: `Audit code quality:\n\`\`\`${lang}\n${codeSnippet}\n\`\`\`\n\nRate: architecture, readability, maintainability, testability (1-10 each). List top 5 quality improvements.`,
        models: PLANNING_MODELS,
      }),
      runAgent({
        name: "SecurityAuditor", role: "Security Engineer",
        systemPrompt: "You perform security audits using OWASP methodology.",
        userPrompt: `Security audit:\n\`\`\`${lang}\n${codeSnippet}\n\`\`\`\n\nFind all security vulnerabilities. Rate severity. Provide fixes.`,
        models: PLANNING_MODELS,
      }),
      runAgent({
        name: "PerfAuditor", role: "Performance Engineer",
        systemPrompt: "You identify performance bottlenecks and anti-patterns.",
        userPrompt: `Performance audit:\n\`\`\`${lang}\n${codeSnippet}\n\`\`\`\n\nFind performance issues, anti-patterns, and optimization opportunities.`,
        models: PLANNING_MODELS,
      }),
    ]);

    const quality = qualityResult.status === "fulfilled" ? qualityResult.value : "Audit failed";
    const security = securityResult.status === "fulfilled" ? securityResult.value : "Audit failed";
    const perf = perfResult.status === "fulfilled" ? perfResult.value : "Audit failed";

    send({ event: "complete", audit: { quality, security, performance: perf } });
  } catch (err: any) {
    send({ event: "error", error: err.message });
  }

  res.end();
});

export default router;
