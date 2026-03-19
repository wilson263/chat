/**
 * Advanced Prompt Engineering Engine for ZorvixAI
 *
 * Provides:
 * - Dynamic prompt templates with variable injection
 * - Chain-of-thought (CoT) reasoning prompts
 * - Few-shot example management
 * - Role-specific persona prompts
 * - Task decomposition prompts
 * - Prompt compression for long inputs
 * - Structured output prompts (force JSON responses)
 * - Adversarial prompt detection & sanitization
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  tags: string[];
  exampleOutput?: string;
}

export interface FewShotExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ChainOfThoughtConfig {
  steps: string[];
  showWorkings: boolean;
  verifyAnswer: boolean;
}

export interface PromptBuildResult {
  systemPrompt: string;
  userPrompt: string;
  estimatedTokens: number;
  strategy: string;
}

// ── Built-in Prompt Templates ─────────────────────────────────────────────────

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  code_generation: {
    id: "code_generation",
    name: "Code Generation",
    description: "Generate complete, production-ready code",
    template: `Generate {{language}} code for the following requirement:

REQUIREMENT: {{requirement}}
{{#if constraints}}
CONSTRAINTS: {{constraints}}
{{/if}}
{{#if context}}
CONTEXT: {{context}}
{{/if}}

Rules:
- Write complete, runnable code — no placeholders or "// TODO" comments
- Use {{language}} best practices and modern idioms
- Include error handling for all failure modes
- Add brief inline comments for non-obvious logic
- Make it production-ready, not just a prototype`,
    variables: ["language", "requirement", "constraints", "context"],
    tags: ["code", "generation"],
  },

  code_review_expert: {
    id: "code_review_expert",
    name: "Expert Code Review",
    description: "Senior engineer code review with specific focus areas",
    template: `You are a principal engineer at a top tech company reviewing code for production readiness.

Review focus: {{focus}}
Review this {{language}} code with the eye of a senior engineer who has seen every production failure mode:

\`\`\`{{language}}
{{code}}
\`\`\`

Provide a structured review covering:
1. **Bugs** — Any logic errors, null pointer risks, race conditions, off-by-one errors
2. **Security** — OWASP vulnerabilities, injection risks, auth bypasses
3. **Performance** — N+1 queries, unnecessary allocations, blocking operations
4. **Maintainability** — Complexity, naming, separation of concerns
5. **Missing Cases** — Edge cases, error states, empty inputs not handled

For each issue: line/function → severity → explanation → corrected code`,
    variables: ["language", "code", "focus"],
    tags: ["review", "quality"],
  },

  system_design: {
    id: "system_design",
    name: "System Design",
    description: "Design scalable systems and architectures",
    template: `Design a system for: {{requirement}}

Scale requirements:
- Users: {{users}}
- Requests per second: {{rps}}
- Data volume: {{data_volume}}
- Latency SLA: {{latency}}

Design with these constraints: {{constraints}}

Provide a complete system design:
1. High-level architecture diagram (ASCII)
2. Component breakdown with responsibilities
3. Database schema and technology choices
4. API design and data flow
5. Scalability strategy (horizontal/vertical)
6. Caching layers and CDN strategy
7. Failure modes and resilience patterns
8. Estimated cost at scale`,
    variables: ["requirement", "users", "rps", "data_volume", "latency", "constraints"],
    tags: ["architecture", "design"],
  },

  bug_hunter: {
    id: "bug_hunter",
    name: "Bug Hunter",
    description: "Systematic bug detection and analysis",
    template: `You are a bug hunter with 20 years of debugging experience. Systematically hunt for bugs in this code.

Think step-by-step:
1. What are all the possible inputs?
2. What could cause each function/block to fail?
3. Are there any race conditions or timing issues?
4. Are all error cases handled?
5. Are there any off-by-one, type coercion, or null reference bugs?

Code to analyze:
\`\`\`{{language}}
{{code}}
\`\`\`

{{#if error}}
Reported error: {{error}}
{{/if}}

List every bug found, ranked by severity. For each bug:
- Location (function/line)
- Severity (critical/high/medium/low)
- Description of the bug
- How it could be triggered
- The fix`,
    variables: ["language", "code", "error"],
    tags: ["debug", "bugs"],
  },

  teaching_explanation: {
    id: "teaching_explanation",
    name: "Teaching Explanation",
    description: "Explain concepts at the right level",
    template: `Explain {{concept}} to someone with a {{level}} programming background.

{{#if analogy_domain}}
Use analogies from: {{analogy_domain}}
{{/if}}

Structure your explanation:
1. **The Core Idea** (one sentence, no jargon)
2. **Why It Matters** (practical motivation)
3. **How It Works** (step-by-step, visual if possible)
4. **A Simple Example** (minimal working code)
5. **A Real-World Example** (production-style usage)
6. **Common Mistakes** (pitfalls to avoid)
7. **What to Learn Next** (natural progression)

Use ASCII diagrams where helpful. Be engaging, not dry.`,
    variables: ["concept", "level", "analogy_domain"],
    tags: ["teaching", "education"],
  },

  refactor_guide: {
    id: "refactor_guide",
    name: "Refactoring Guide",
    description: "Step-by-step refactoring with rationale",
    template: `Refactor this code to improve: {{goals}}

Original code:
\`\`\`{{language}}
{{code}}
\`\`\`

Apply these refactoring patterns where appropriate:
- Extract Method / Extract Function
- Rename for clarity
- Remove duplication (DRY)
- Simplify conditionals
- Replace magic numbers with named constants
- Separate concerns
- Add/improve error handling
- {{specific_patterns}}

Provide:
1. List of refactoring steps taken (each with rationale)
2. The refactored code
3. Before/after comparison of key changes
4. Any trade-offs or caveats`,
    variables: ["goals", "language", "code", "specific_patterns"],
    tags: ["refactoring", "quality"],
  },
};

// ── Template Rendering ────────────────────────────────────────────────────────

/**
 * Renders a prompt template by replacing {{variable}} placeholders.
 * Supports {{#if variable}}...{{/if}} conditional blocks.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | undefined>
): string {
  // Handle {{#if var}}...{{/if}} conditionals
  let result = template.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, varName, content) => (variables[varName] ? content : "")
  );

  // Replace {{variable}} placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (_, varName) => variables[varName] ?? "");

  // Clean up extra blank lines from removed conditionals
  result = result.replace(/\n{3,}/g, "\n\n").trim();

  return result;
}

/**
 * Renders a named template with the provided variables.
 */
export function renderNamedTemplate(
  templateId: string,
  variables: Record<string, string | undefined>
): string {
  const tpl = PROMPT_TEMPLATES[templateId];
  if (!tpl) throw new Error(`Unknown template: ${templateId}`);
  return renderTemplate(tpl.template, variables);
}

// ── Chain of Thought Builder ──────────────────────────────────────────────────

/**
 * Wraps a user prompt with chain-of-thought reasoning instructions.
 * Forces the AI to think step-by-step before answering.
 */
export function buildChainOfThoughtPrompt(
  userPrompt: string,
  config: Partial<ChainOfThoughtConfig> = {}
): string {
  const steps = config.steps ?? [
    "Understand what is being asked",
    "Identify relevant information and constraints",
    "Plan the approach",
    "Execute step by step",
    "Verify the result makes sense",
  ];

  const stepList = steps.map((s, i) => `Step ${i + 1}: ${s}`).join("\n");

  const verifySection = config.verifyAnswer
    ? `\n\nAfter completing your reasoning, verify your answer:\n- Does it satisfy all the requirements?\n- Are there edge cases I haven't handled?\n- Is my solution correct?`
    : "";

  return `${userPrompt}

Think through this systematically before answering:
${stepList}
${verifySection}

${config.showWorkings !== false ? "Show your reasoning for each step, then provide the final answer." : "Provide the final answer after completing your reasoning."}`;
}

// ── Few-Shot Example Builder ──────────────────────────────────────────────────

/**
 * Builds a prompt with few-shot examples to guide the AI's output format.
 */
export function buildFewShotPrompt(
  instruction: string,
  examples: FewShotExample[],
  userInput: string
): string {
  const exampleText = examples
    .map((ex, i) => {
      const explanation = ex.explanation ? `\n// ${ex.explanation}` : "";
      return `Example ${i + 1}:
Input: ${ex.input}
Output: ${ex.output}${explanation}`;
    })
    .join("\n\n");

  return `${instruction}

${exampleText}

Now complete the following:
Input: ${userInput}
Output:`;
}

// ── Structured Output Prompt ──────────────────────────────────────────────────

/**
 * Builds a prompt that forces the AI to return a specific JSON structure.
 * Includes schema description and strict output rules.
 */
export function buildStructuredOutputPrompt(
  task: string,
  schema: Record<string, string>,
  example?: Record<string, unknown>
): string {
  const schemaDescription = Object.entries(schema)
    .map(([key, desc]) => `  "${key}": ${desc}`)
    .join(",\n");

  const exampleSection = example
    ? `\nExample output:\n\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\``
    : "";

  return `${task}

IMPORTANT: Respond with ONLY a valid JSON object matching this exact schema:
\`\`\`json
{
${schemaDescription}
}
\`\`\`
${exampleSection}

Rules:
- Output ONLY the JSON object — no markdown, no explanation, no code fences
- All fields are required unless marked optional
- Do not add extra fields not in the schema
- Ensure JSON is valid (no trailing commas, proper escaping)`;
}

// ── Adversarial Prompt Detection ──────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+instructions/i,
  /disregard\s+(your|the)\s+(system|previous)\s+(prompt|instructions)/i,
  /you\s+are\s+now\s+(?:a|an)\s+(?:different|new|evil|uncensored)/i,
  /forget\s+(everything|all)\s+(you|i|we)\s+(told|said|discussed)/i,
  /act\s+as\s+(?:if\s+you\s+are|a)\s+(?:dan|jailbreak|unrestricted)/i,
  /\bDAN\b|\bjailbreak\b|\buncensored mode\b/i,
  /pretend\s+(you\s+are|that)\s+(?:not|an?\s+AI|a\s+human)/i,
  /override\s+(your|the)\s+(safety|ethical|content)\s+guidelines/i,
  /from\s+now\s+on\s+you\s+(will|must|should)\s+(?:ignore|forget|not)/i,
];

export interface SanitizationResult {
  safe: boolean;
  suspicionLevel: "none" | "low" | "medium" | "high";
  detectedPatterns: string[];
  sanitizedInput: string;
}

/**
 * Detects and flags prompt injection attempts.
 * Returns a sanitization result with the cleaned input.
 */
export function sanitizeUserInput(input: string): SanitizationResult {
  const detectedPatterns: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source);
    }
  }

  const suspicionLevel: SanitizationResult["suspicionLevel"] =
    detectedPatterns.length === 0 ? "none" :
    detectedPatterns.length === 1 ? "low" :
    detectedPatterns.length === 2 ? "medium" : "high";

  const safe = suspicionLevel === "none" || suspicionLevel === "low";

  // Sanitize by escaping obvious injection markers
  const sanitizedInput = input
    .replace(/\[\[.*?\]\]/g, "")  // Remove bracket commands
    .replace(/\{%.*?%\}/g, "")    // Remove template tags
    .trim();

  return { safe, suspicionLevel, detectedPatterns, sanitizedInput };
}

// ── Persona Builders ──────────────────────────────────────────────────────────

export type PersonaType =
  | "senior_engineer"
  | "security_expert"
  | "data_scientist"
  | "devops_engineer"
  | "ui_ux_designer"
  | "product_manager"
  | "architect"
  | "teacher"
  | "code_reviewer";

const PERSONA_PROMPTS: Record<PersonaType, string> = {
  senior_engineer:
    "You are a senior software engineer with 15+ years of experience across multiple languages and paradigms. You write clean, efficient, well-tested code and mentor others through detailed explanations.",

  security_expert:
    "You are a security engineer and penetration tester with deep expertise in application security, OWASP vulnerabilities, cryptography, and secure coding practices. You identify threats others miss.",

  data_scientist:
    "You are a data scientist and ML engineer specializing in statistical analysis, machine learning, and data visualization. You translate complex data insights into actionable recommendations.",

  devops_engineer:
    "You are a DevOps and platform engineering expert specializing in CI/CD, Kubernetes, cloud infrastructure, observability, and reliability engineering. You think in systems and automation.",

  ui_ux_designer:
    "You are a senior UI/UX designer with expertise in user research, design systems, accessibility (WCAG), and translating user needs into elegant interfaces. You think pixel-perfect but also from the user's perspective.",

  product_manager:
    "You are a product manager who bridges business, design, and engineering. You think in user stories, metrics, trade-offs, and MVP scope. You turn vague requirements into clear, implementable specs.",

  architect:
    "You are a software architect specializing in distributed systems, microservices, event-driven architectures, and large-scale system design. You think about CAP theorem, failure modes, and 10x scale.",

  teacher:
    "You are an exceptional technical educator who makes complex concepts simple and intuitive. You use analogies, visual explanations, and progressive examples. You meet learners at their level.",

  code_reviewer:
    "You are a meticulous code reviewer who catches bugs before production, enforces best practices, and improves code quality through constructive, specific, actionable feedback.",
};

/**
 * Returns the system prompt for a given persona.
 */
export function getPersonaPrompt(persona: PersonaType): string {
  return PERSONA_PROMPTS[persona];
}

// ── Prompt Compression ────────────────────────────────────────────────────────

/**
 * Compresses a long prompt by removing redundant information.
 * Preserves code blocks and key instructions.
 */
export function compressPrompt(prompt: string, targetLength: number): string {
  if (prompt.length <= targetLength) return prompt;

  // Extract and preserve code blocks
  const codeBlocks: string[] = [];
  const withoutCode = prompt.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `[[CODE_BLOCK_${codeBlocks.length - 1}]]`;
  });

  // Truncate prose sections
  const words = withoutCode.split(/\s+/);
  const targetWords = Math.floor(targetLength / 5);
  let compressed = words.slice(0, targetWords).join(" ");

  if (words.length > targetWords) {
    compressed += " [... content compressed for context window ...]";
  }

  // Restore code blocks (always fully preserve)
  codeBlocks.forEach((block, i) => {
    compressed = compressed.replace(`[[CODE_BLOCK_${i}]]`, block);
  });

  return compressed;
}

// ── Prompt Quality Scorer ─────────────────────────────────────────────────────

export interface PromptQualityScore {
  score: number;
  issues: string[];
  suggestions: string[];
}

/**
 * Scores the quality of a prompt to predict AI output quality.
 * Higher scores = better, more specific prompts.
 */
export function scorePromptQuality(prompt: string): PromptQualityScore {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (prompt.length < 20) {
    issues.push("Prompt is very short and likely too vague");
    score -= 30;
  }

  if (!/[?.!]/.test(prompt)) {
    suggestions.push("Add a clear question or instruction at the end");
    score -= 5;
  }

  if (/\b(something|somehow|stuff|things|whatever)\b/i.test(prompt)) {
    issues.push("Vague words detected (something, stuff, things)");
    suggestions.push("Be specific about what you want");
    score -= 15;
  }

  if (prompt.length > 100 && !/\b(format|structure|output|respond|provide|include|list)\b/i.test(prompt)) {
    suggestions.push("Specify the output format (list, JSON, code, explanation, etc.)");
    score -= 10;
  }

  if (/\b(always|never|must|required|important|critical)\b/i.test(prompt)) {
    score += 10;
  }

  if (prompt.includes("example") || prompt.includes("for instance")) {
    score += 5;
  }

  if (prompt.includes("step by step") || prompt.includes("step-by-step")) {
    score += 5;
  }

  return { score: Math.max(0, Math.min(100, score)), issues, suggestions };
}

// ── Dynamic Prompt Builder ────────────────────────────────────────────────────

export interface DynamicPromptOptions {
  task: string;
  persona?: PersonaType;
  useChainOfThought?: boolean;
  chainOfThoughtSteps?: string[];
  fewShotExamples?: FewShotExample[];
  outputSchema?: Record<string, string>;
  outputSchemaExample?: Record<string, unknown>;
  constraints?: string[];
  language?: string;
  audience?: string;
}

/**
 * Builds a fully optimized prompt from a high-level task description.
 * Automatically selects the best prompting strategy.
 */
export function buildDynamicPrompt(options: DynamicPromptOptions): PromptBuildResult {
  const {
    task,
    persona,
    useChainOfThought,
    chainOfThoughtSteps,
    fewShotExamples,
    outputSchema,
    outputSchemaExample,
    constraints,
    language,
    audience,
  } = options;

  let systemPrompt = persona ? getPersonaPrompt(persona) : "";

  if (audience) {
    systemPrompt += `\n\nAudience: ${audience}`;
  }

  if (constraints && constraints.length > 0) {
    systemPrompt += `\n\nConstraints:\n${constraints.map(c => `- ${c}`).join("\n")}`;
  }

  if (language) {
    systemPrompt += `\n\nPrimary language/technology: ${language}`;
  }

  let userPrompt = task;

  if (fewShotExamples && fewShotExamples.length > 0) {
    userPrompt = buildFewShotPrompt(task, fewShotExamples, "");
  }

  if (outputSchema) {
    userPrompt = buildStructuredOutputPrompt(task, outputSchema, outputSchemaExample);
  }

  if (useChainOfThought) {
    userPrompt = buildChainOfThoughtPrompt(userPrompt, {
      steps: chainOfThoughtSteps,
      showWorkings: true,
      verifyAnswer: true,
    });
  }

  const strategyParts: string[] = [];
  if (persona) strategyParts.push(`persona:${persona}`);
  if (useChainOfThought) strategyParts.push("chain-of-thought");
  if (fewShotExamples?.length) strategyParts.push(`few-shot(${fewShotExamples.length})`);
  if (outputSchema) strategyParts.push("structured-output");

  return {
    systemPrompt: systemPrompt || "You are ZorvixAI, an expert AI coding assistant.",
    userPrompt,
    estimatedTokens: Math.ceil((systemPrompt.length + userPrompt.length) / 3.5),
    strategy: strategyParts.join("+") || "default",
  };
}
