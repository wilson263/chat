/**
 * AI Software Architect Routes for ZorvixAI
 *
 * Endpoints:
 *   POST /api/architect/design       — Generate full system design
 *   POST /api/architect/diagram      — Generate ASCII architecture diagrams
 *   POST /api/architect/tech-stack   — Recommend tech stack for a project
 *   POST /api/architect/api-design   — Design a REST or GraphQL API
 *   POST /api/architect/db-schema    — Design an optimized database schema
 *   POST /api/architect/scalability  — Analyze and improve scalability
 *   POST /api/architect/microservices — Split monolith into microservices
 */

import { Router, type Request, type Response } from "express";
import { createChatCompletion, createChatCompletionStream } from "../lib/ai";

const router = Router();

const ARCHITECT_SYSTEM = `You are a world-class software architect with 20+ years of experience designing systems at massive scale. You've worked at companies like Google, Netflix, Stripe, and Uber. You think about:
- Scalability (from 100 to 100M users)
- Reliability (99.99% uptime)
- Maintainability (clean architecture, low coupling)
- Security (zero-trust, defense in depth)
- Cost-efficiency (don't over-engineer)
- Developer experience (teams can move fast)

You use ASCII diagrams liberally. You are specific, not vague. You cite trade-offs.`;

// ── Full System Design ────────────────────────────────────────────────────────

router.post("/api/architect/design", async (req: Request, res: Response): Promise<void> => {
  const { requirement, scale, constraints, existingTech, stream: wantStream } = req.body as {
    requirement: string;
    scale?: string;
    constraints?: string;
    existingTech?: string;
    stream?: boolean;
  };

  if (!requirement) { res.status(400).json({ error: "requirement is required" }); return; }

  const prompt = `Design a complete system for: ${requirement}

Scale: ${scale ?? "Start with 10K users, design to scale to 10M"}
Constraints: ${constraints ?? "Use modern cloud-native technologies"}
${existingTech ? `Existing tech to integrate: ${existingTech}` : ""}

Provide a COMPLETE system design:

## 1. System Overview
(High-level description and key design goals)

## 2. Architecture Diagram (ASCII)
\`\`\`
[Draw a detailed ASCII architecture diagram showing all components and their connections]
\`\`\`

## 3. Core Components
(For each component: responsibility, technology, scaling strategy)

## 4. Data Flow
(Step-by-step flow for the main user journey)

## 5. Database Design
(Tables/collections, indexes, sharding strategy)

## 6. API Design
(Key endpoints, authentication, versioning)

## 7. Caching Strategy
(What to cache, where, TTL strategy, invalidation)

## 8. Scaling Strategy
(How to scale each tier from 10K → 10M users)

## 9. Reliability & Resilience
(Circuit breakers, retries, fallbacks, disaster recovery)

## 10. Security Architecture
(Auth, encryption, network security, secret management)

## 11. Monitoring & Observability
(Metrics, logs, traces, alerting)

## 12. Technology Choices
(Every technology decision with rationale and alternatives considered)

## 13. Cost Estimate
(Monthly cost at different scale points: 10K, 100K, 1M users)`;

  if (wantStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const stream = await createChatCompletionStream({
        messages: [
          { role: "system", content: ARCHITECT_SYSTEM },
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
          { role: "system", content: ARCHITECT_SYSTEM },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 60000,
      });
      res.json({ design: result.choices[0]?.message?.content ?? "" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Architecture Diagram Generator ───────────────────────────────────────────

router.post("/api/architect/diagram", async (req: Request, res: Response): Promise<void> => {
  const { system, type, components } = req.body as {
    system: string;
    type?: "system" | "sequence" | "er" | "flowchart" | "deployment";
    components?: string[];
  };

  if (!system) { res.status(400).json({ error: "system description is required" }); return; }

  const diagramTypes = {
    system: "system architecture diagram showing all services and their connections",
    sequence: "sequence diagram showing the order of operations and message flows",
    er: "entity-relationship diagram showing database tables and their relationships",
    flowchart: "flowchart showing the decision logic and process flow",
    deployment: "deployment diagram showing infrastructure, servers, and environments",
  };

  const diagramType = diagramTypes[type ?? "system"];

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ARCHITECT_SYSTEM },
        {
          role: "user",
          content: `Create a detailed ${diagramType} for: ${system}
${components ? `Components to include: ${components.join(", ")}` : ""}

Use ASCII art to draw a clear, detailed diagram. Make it professional and easy to understand.
Include all relevant components, connections, data flows, and labels.
After the diagram, add a legend explaining all symbols and abbreviations used.`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ diagram: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Tech Stack Recommender ────────────────────────────────────────────────────

router.post("/api/architect/tech-stack", async (req: Request, res: Response): Promise<void> => {
  const { projectType, requirements, teamSize, timeline, budget } = req.body as {
    projectType: string;
    requirements?: string;
    teamSize?: number;
    timeline?: string;
    budget?: string;
  };

  if (!projectType) { res.status(400).json({ error: "projectType is required" }); return; }

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ARCHITECT_SYSTEM },
        {
          role: "user",
          content: `Recommend the optimal tech stack for:
Project type: ${projectType}
${requirements ? `Requirements: ${requirements}` : ""}
Team size: ${teamSize ?? "3-5 developers"}
Timeline: ${timeline ?? "3-6 months to MVP"}
Budget: ${budget ?? "startup budget"}

Recommend a COMPLETE tech stack with rationale:

## Frontend
(Framework, state management, styling, build tool — with alternatives)

## Backend
(Language, framework, API style — with alternatives)

## Database
(Primary DB, caching, search — with alternatives)

## Infrastructure & DevOps
(Cloud provider, containerization, CI/CD — with alternatives)

## Authentication
(Auth strategy and library)

## Monitoring
(Logging, metrics, error tracking)

## Key Third-Party Services
(Payment, email, storage, etc.)

## Tech Stack Comparison Table
| Technology | Choice | Alternative 1 | Alternative 2 | Why We Chose |
|------------|--------|---------------|---------------|--------------|

## What to Avoid
(Tempting choices that would be wrong for this project and why)

## Getting Started
(First 5 commands to bootstrap this stack)`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ recommendation: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── API Designer ──────────────────────────────────────────────────────────────

router.post("/api/architect/api-design", async (req: Request, res: Response): Promise<void> => {
  const { description, style, entities, authType } = req.body as {
    description: string;
    style?: "rest" | "graphql" | "grpc";
    entities?: string[];
    authType?: string;
  };

  if (!description) { res.status(400).json({ error: "description is required" }); return; }

  const apiStyle = style ?? "rest";

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ARCHITECT_SYSTEM },
        {
          role: "user",
          content: `Design a complete ${apiStyle.toUpperCase()} API for: ${description}
${entities ? `Core entities: ${entities.join(", ")}` : ""}
Authentication: ${authType ?? "JWT Bearer tokens"}

Provide a complete API design:

## API Overview
(Base URL, versioning strategy, content type)

## Authentication
(Auth flow, token refresh, permissions model)

## Endpoints
(For each endpoint: method, path, request body, response schema, status codes, example)

## Error Handling
(Consistent error format, all possible error codes)

## Pagination
(Strategy: cursor or offset, response envelope)

## Rate Limiting
(Limits per endpoint tier, headers returned)

## Webhooks
(If applicable: events, payload format, retry policy)

## OpenAPI Spec
(Key parts of the OpenAPI 3.1 specification in YAML)`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ apiDesign: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Database Schema Designer ──────────────────────────────────────────────────

router.post("/api/architect/db-schema", async (req: Request, res: Response): Promise<void> => {
  const { description, dbType, entities, scale } = req.body as {
    description: string;
    dbType?: string;
    entities?: string[];
    scale?: string;
  };

  if (!description) { res.status(400).json({ error: "description is required" }); return; }

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ARCHITECT_SYSTEM },
        {
          role: "user",
          content: `Design an optimized database schema for: ${description}
Database: ${dbType ?? "PostgreSQL"}
${entities ? `Core entities: ${entities.join(", ")}` : ""}
Scale target: ${scale ?? "100K users, 10M records"}

Design a complete, normalized schema:

## Entity Relationship Diagram (ASCII)
\`\`\`
[Draw ER diagram with all tables and relationships]
\`\`\`

## Table Definitions
(For each table: columns, types, constraints, defaults)

## Indexes
(Every index needed with the query it optimizes)

## Relationships
(Foreign keys, cascades, relationship types)

## Drizzle ORM Schema
\`\`\`typescript
[Complete Drizzle ORM schema code]
\`\`\`

## Query Patterns
(The most common queries and how the schema optimizes them)

## Scaling Considerations
(Partitioning, archiving, sharding strategy when needed)

## Data Integrity Rules
(Check constraints, triggers, business rules enforced at DB level)`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ schema: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Scalability Analyzer ──────────────────────────────────────────────────────

router.post("/api/architect/scalability", async (req: Request, res: Response): Promise<void> => {
  const { code, architecture, currentScale, targetScale } = req.body as {
    code?: string;
    architecture?: string;
    currentScale?: string;
    targetScale?: string;
  };

  if (!code && !architecture) {
    res.status(400).json({ error: "code or architecture description is required" });
    return;
  }

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ARCHITECT_SYSTEM },
        {
          role: "user",
          content: `Analyze scalability for:
${code ? `Code:\n\`\`\`\n${code.slice(0, 3000)}\n\`\`\`` : `Architecture: ${architecture}`}
Current scale: ${currentScale ?? "1K users/day"}
Target scale: ${targetScale ?? "1M users/day"}

Provide a scalability analysis:

## Current Bottlenecks
(Specific parts that will break first as load increases)

## Scalability Issues Ranked by Impact
(Most critical to least critical)

## Scaling Roadmap
Phase 1 (1K → 10K): [changes needed]
Phase 2 (10K → 100K): [changes needed]
Phase 3 (100K → 1M): [changes needed]

## Architectural Changes Required
(Structural changes: caching, queuing, sharding, CDN)

## Database Scaling Plan
(Read replicas, connection pooling, sharding, caching)

## Performance Optimizations
(Quick wins vs major refactoring)

## Load Testing Plan
(How to validate each scale milestone)`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ analysis: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Microservices Decomposition ───────────────────────────────────────────────

router.post("/api/architect/microservices", async (req: Request, res: Response): Promise<void> => {
  const { monolithDescription, code, splitCriteria } = req.body as {
    monolithDescription?: string;
    code?: string;
    splitCriteria?: string;
  };

  if (!monolithDescription && !code) {
    res.status(400).json({ error: "monolithDescription or code is required" });
    return;
  }

  try {
    const result = await createChatCompletion({
      messages: [
        { role: "system", content: ARCHITECT_SYSTEM },
        {
          role: "user",
          content: `Decompose this monolith into microservices:
${monolithDescription ? `System: ${monolithDescription}` : ""}
${code ? `Code:\n\`\`\`\n${code.slice(0, 2000)}\n\`\`\`` : ""}
Split criteria: ${splitCriteria ?? "by domain (Domain-Driven Design), team ownership, scaling needs"}

Provide a microservices decomposition plan:

## Bounded Contexts
(Identify the natural domain boundaries)

## Microservices Map (ASCII)
\`\`\`
[Diagram of all microservices and their communication]
\`\`\`

## Service Definitions
(For each service: responsibility, API, data store, team ownership)

## Communication Patterns
(Sync REST/gRPC vs async events — which to use where)

## Data Management
(Each service owns its data — how to handle shared data)

## Migration Strategy
(Strangler Fig pattern: step-by-step migration from monolith)

## Shared Infrastructure
(API gateway, service mesh, distributed tracing, secrets)

## Risks & Anti-Patterns to Avoid
(Distributed monolith, chatty services, shared databases)`,
        },
      ],
      max_completion_tokens: 60000,
    });
    res.json({ decomposition: result.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
