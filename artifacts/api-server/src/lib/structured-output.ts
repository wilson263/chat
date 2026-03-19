/**
 * Structured Output Extraction for ZorvixAI
 *
 * Forces the AI to return well-formed JSON that matches a schema.
 * Retries with correction prompts when the AI returns invalid JSON.
 * Used by multi-agent systems and pipelines to get reliable structured data.
 */

import { createChatCompletion } from "./ai";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SchemaType =
  | "string"
  | "number"
  | "boolean"
  | "string[]"
  | "number[]"
  | "object"
  | "string | null"
  | "number | null";

export interface FieldSchema {
  type: SchemaType;
  description: string;
  required?: boolean;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface OutputSchema {
  [fieldName: string]: FieldSchema;
}

export interface ExtractionResult<T> {
  success: boolean;
  data: T | null;
  rawOutput: string;
  attempts: number;
  validationErrors: string[];
}

// ── JSON Extraction ───────────────────────────────────────────────────────────

/**
 * Attempts to extract a JSON object from a raw string.
 * Handles cases where the AI wraps JSON in markdown code fences.
 */
export function extractJsonFromText(text: string): unknown {
  // Try parsing as-is first
  try {
    return JSON.parse(text.trim());
  } catch {}

  // Extract from ```json ... ``` blocks
  const jsonFenceMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonFenceMatch) {
    try {
      return JSON.parse(jsonFenceMatch[1].trim());
    } catch {}
  }

  // Extract from ``` ... ``` blocks (no language specified)
  const fenceMatch = text.match(/```\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // Find the first { ... } block
  const braceMatch = text.match(/(\{[\s\S]*\})/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[1]);
    } catch {}
  }

  // Find the first [ ... ] block (for arrays)
  const bracketMatch = text.match(/(\[[\s\S]*\])/);
  if (bracketMatch) {
    try {
      return JSON.parse(bracketMatch[1]);
    } catch {}
  }

  // Try fixing common JSON errors
  const cleaned = text
    .replace(/,\s*}/g, "}")       // trailing commas in objects
    .replace(/,\s*]/g, "]")       // trailing commas in arrays
    .replace(/(['"])?([a-zA-Z_]\w*)(['"])?:/g, '"$2":')  // unquoted keys
    .replace(/'/g, '"');           // single quotes to double

  const cleanedMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (cleanedMatch) {
    try {
      return JSON.parse(cleanedMatch[1]);
    } catch {}
  }

  return null;
}

// ── Schema Validation ─────────────────────────────────────────────────────────

/**
 * Validates a parsed object against an output schema.
 * Returns an array of validation error messages (empty = valid).
 */
export function validateAgainstSchema(
  data: unknown,
  schema: OutputSchema
): string[] {
  const errors: string[] = [];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return ["Expected a JSON object at the top level"];
  }

  const obj = data as Record<string, unknown>;

  for (const [field, fieldSchema] of Object.entries(schema)) {
    const value = obj[field];

    if (fieldSchema.required !== false && value === undefined) {
      errors.push(`Missing required field: "${field}"`);
      continue;
    }

    if (value === undefined || value === null) continue;

    const typeError = validateFieldType(field, value, fieldSchema);
    if (typeError) errors.push(typeError);

    if (fieldSchema.enum && !fieldSchema.enum.includes(String(value))) {
      errors.push(`Field "${field}" must be one of: ${fieldSchema.enum.join(", ")}. Got: "${value}"`);
    }

    if (fieldSchema.type === "string" || fieldSchema.type === "string | null") {
      const str = String(value);
      if (fieldSchema.minLength && str.length < fieldSchema.minLength) {
        errors.push(`Field "${field}" must be at least ${fieldSchema.minLength} characters`);
      }
      if (fieldSchema.maxLength && str.length > fieldSchema.maxLength) {
        errors.push(`Field "${field}" must be at most ${fieldSchema.maxLength} characters`);
      }
    }

    if (fieldSchema.type === "number" || fieldSchema.type === "number | null") {
      const num = Number(value);
      if (fieldSchema.min !== undefined && num < fieldSchema.min) {
        errors.push(`Field "${field}" must be >= ${fieldSchema.min}`);
      }
      if (fieldSchema.max !== undefined && num > fieldSchema.max) {
        errors.push(`Field "${field}" must be <= ${fieldSchema.max}`);
      }
    }
  }

  return errors;
}

function validateFieldType(field: string, value: unknown, schema: FieldSchema): string | null {
  switch (schema.type) {
    case "string":
      if (typeof value !== "string") return `Field "${field}" must be a string, got ${typeof value}`;
      break;
    case "number":
      if (typeof value !== "number") return `Field "${field}" must be a number, got ${typeof value}`;
      break;
    case "boolean":
      if (typeof value !== "boolean") return `Field "${field}" must be boolean, got ${typeof value}`;
      break;
    case "string[]":
      if (!Array.isArray(value) || value.some(v => typeof v !== "string")) {
        return `Field "${field}" must be an array of strings`;
      }
      break;
    case "number[]":
      if (!Array.isArray(value) || value.some(v => typeof v !== "number")) {
        return `Field "${field}" must be an array of numbers`;
      }
      break;
    case "string | null":
      if (value !== null && typeof value !== "string") {
        return `Field "${field}" must be a string or null`;
      }
      break;
  }
  return null;
}

// ── Structured Extraction ─────────────────────────────────────────────────────

/**
 * Extracts structured data from the AI with automatic retry and correction.
 *
 * Strategy:
 * 1. Build a prompt that explicitly requests JSON matching the schema
 * 2. Parse and validate the response
 * 3. If invalid, send a correction prompt with the specific errors
 * 4. Retry up to maxAttempts times
 */
export async function extractStructured<T extends Record<string, unknown>>(
  task: string,
  schema: OutputSchema,
  options: {
    maxAttempts?: number;
    model?: string;
    systemPrompt?: string;
    examples?: Array<{ input: string; output: T }>;
  } = {}
): Promise<ExtractionResult<T>> {
  const { maxAttempts = 3, systemPrompt } = options;

  const schemaDescription = Object.entries(schema)
    .map(([key, s]) => `  "${key}": ${s.type} — ${s.description}${s.required === false ? " (optional)" : " (required)"}${s.enum ? `, one of: [${s.enum.map(v => `"${v}"`).join(", ")}]` : ""}`)
    .join("\n");

  const examplesSection = options.examples?.length
    ? `\nExamples:\n${options.examples.map(e => `Input: ${e.input}\nOutput: ${JSON.stringify(e.output)}`).join("\n\n")}\n`
    : "";

  const basePrompt = `${task}
${examplesSection}
Respond with ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
${schemaDescription}
}`;

  let currentPrompt = basePrompt;
  let rawOutput = "";
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const result = await createChatCompletion({
        messages: [
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          { role: "user", content: currentPrompt },
        ],
        max_completion_tokens: 4000,
      });

      rawOutput = result.choices[0]?.message?.content ?? "";
      const parsed = extractJsonFromText(rawOutput);

      if (parsed === null) {
        currentPrompt = `${basePrompt}\n\nYour previous response was not valid JSON. Please output ONLY the JSON object.`;
        continue;
      }

      const validationErrors = validateAgainstSchema(parsed, schema);

      if (validationErrors.length > 0) {
        currentPrompt = `${basePrompt}\n\nYour previous response had these validation errors:\n${validationErrors.map(e => `- ${e}`).join("\n")}\n\nPlease fix and try again.`;
        continue;
      }

      return { success: true, data: parsed as T, rawOutput, attempts, validationErrors: [] };
    } catch (err: any) {
      rawOutput = err.message;
    }
  }

  return { success: false, data: null, rawOutput, attempts, validationErrors: ["Max attempts reached"] };
}

// ── Pre-built Extractors ──────────────────────────────────────────────────────

export interface CodeAnalysisOutput {
  summary: string;
  language: string;
  issues: string[];
  suggestions: string[];
  quality_score: number;
  is_production_ready: boolean;
}

export async function extractCodeAnalysis(code: string): Promise<ExtractionResult<CodeAnalysisOutput>> {
  return extractStructured<CodeAnalysisOutput>(
    `Analyze this code:\n\`\`\`\n${code}\n\`\`\``,
    {
      summary: { type: "string", description: "One-sentence summary of what the code does" },
      language: { type: "string", description: "Programming language detected" },
      issues: { type: "string[]", description: "List of bugs or problems found" },
      suggestions: { type: "string[]", description: "List of improvement suggestions" },
      quality_score: { type: "number", description: "Code quality score 0-100", min: 0, max: 100 },
      is_production_ready: { type: "boolean", description: "Whether code is ready for production" },
    }
  );
}

export interface TaskDecompositionOutput {
  tasks: string[];
  dependencies: string[];
  estimated_hours: number;
  complexity: "low" | "medium" | "high";
  risks: string[];
}

export async function extractTaskDecomposition(
  projectDescription: string
): Promise<ExtractionResult<TaskDecompositionOutput>> {
  return extractStructured<TaskDecompositionOutput>(
    `Decompose this project into concrete development tasks:\n${projectDescription}`,
    {
      tasks: { type: "string[]", description: "List of specific implementation tasks in order" },
      dependencies: { type: "string[]", description: "External dependencies/libraries needed" },
      estimated_hours: { type: "number", description: "Estimated total development hours", min: 0 },
      complexity: { type: "string", description: "Overall complexity level", enum: ["low", "medium", "high"] },
      risks: { type: "string[]", description: "Key technical risks to be aware of" },
    }
  );
}
