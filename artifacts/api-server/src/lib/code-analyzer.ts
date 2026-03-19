/**
 * Code Analyzer for ZorvixAI
 *
 * Static analysis utilities that run without executing code:
 * - Language detection with confidence scores
 * - Complexity metrics (cyclomatic, cognitive)
 * - Security vulnerability pattern detection
 * - Performance anti-pattern detection
 * - Code quality scoring
 * - Dependency extraction
 * - Documentation coverage metrics
 */

// ── Language Detection ────────────────────────────────────────────────────────

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  framework?: string;
}

const LANGUAGE_SIGNATURES: Array<{
  language: string;
  patterns: RegExp[];
  weight: number;
  framework?: string;
}> = [
  {
    language: "typescript",
    patterns: [/:\s*(string|number|boolean|any|void|never|unknown)\b/, /interface\s+\w+/, /type\s+\w+\s*=/, /as\s+\w+/, /<\w+>/],
    weight: 1.2,
  },
  {
    language: "tsx",
    patterns: [/import\s+React/, /from\s+['"]react['"]/, /JSX\.Element/, /React\.FC/, /<[A-Z]\w+\s*\/>/, /return\s*\(\s*</],
    weight: 1.4,
    framework: "React",
  },
  {
    language: "javascript",
    patterns: [/const\s+\w+\s*=/, /function\s+\w+/, /=>\s*\{/, /require\(/, /module\.exports/],
    weight: 1.0,
  },
  {
    language: "python",
    patterns: [/def\s+\w+\(/, /import\s+\w+/, /from\s+\w+\s+import/, /if\s+__name__\s*==/, /:\s*$/, /print\(/],
    weight: 1.1,
  },
  {
    language: "java",
    patterns: [/public\s+(class|interface|enum)\s+\w+/, /private\s+\w+\s+\w+;/, /System\.out\.print/, /@Override/, /new\s+\w+\(/],
    weight: 1.2,
  },
  {
    language: "rust",
    patterns: [/fn\s+\w+/, /let\s+mut\s+\w+/, /use\s+std::/, /impl\s+\w+/, /->.*\{/, /pub\s+fn/],
    weight: 1.3,
  },
  {
    language: "go",
    patterns: [/func\s+\w+\(/, /package\s+\w+/, /import\s+\(/, /go\s+\w+\(/, /:=\s*/],
    weight: 1.2,
  },
  {
    language: "cpp",
    patterns: [/#include\s*</, /std::/, /int\s+main\(/, /cout\s*<</, /->\s*\w+/, /\bvoid\b/],
    weight: 1.1,
  },
  {
    language: "sql",
    patterns: [/\bSELECT\b.*\bFROM\b/i, /\bINSERT\s+INTO\b/i, /\bCREATE\s+TABLE\b/i, /\bWHERE\s+\w+/i, /\bJOIN\b/i],
    weight: 1.3,
  },
  {
    language: "html",
    patterns: [/<!DOCTYPE/, /<html/, /<body/, /<div\s/, /<script/, /<link\s/],
    weight: 1.2,
  },
  {
    language: "css",
    patterns: [/\{[\s\S]*?:[\s\S]*?\}/, /margin:|padding:|display:|flex:|grid:|color:/, /@media\s*\(/, /\.[\w-]+\s*\{/],
    weight: 1.1,
  },
  {
    language: "shell",
    patterns: [/^#!\/bin\/(bash|sh|zsh)/, /\becho\b/, /\bexport\s+\w+=/, /\bif\s+\[/, /\$\{?\w+\}?/],
    weight: 1.0,
  },
  {
    language: "json",
    patterns: [/^\s*\{/, /"[\w-]+"\s*:/, /\[\s*\{/, /null|true|false/],
    weight: 1.0,
  },
  {
    language: "yaml",
    patterns: [/^---/, /^\w[\w-]*:\s*$/, /- \w+:/, /:\s+['"].*['"]$/],
    weight: 1.0,
  },
];

export function detectLanguage(code: string): LanguageDetectionResult {
  const scores: Record<string, { score: number; framework?: string }> = {};

  for (const sig of LANGUAGE_SIGNATURES) {
    let matches = 0;
    for (const pattern of sig.patterns) {
      if (pattern.test(code)) matches++;
    }
    if (matches > 0) {
      const score = (matches / sig.patterns.length) * sig.weight;
      scores[sig.language] = { score, framework: sig.framework };
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
  if (sorted.length === 0) return { language: "unknown", confidence: 0 };

  const [language, { score, framework }] = sorted[0];
  return { language, confidence: Math.min(score, 1), framework };
}

// ── Complexity Metrics ────────────────────────────────────────────────────────

export interface ComplexityMetrics {
  linesOfCode: number;
  blankLines: number;
  commentLines: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  functionCount: number;
  averageFunctionLength: number;
}

export function calculateComplexity(code: string): ComplexityMetrics {
  const lines = code.split("\n");
  const linesOfCode = lines.length;
  const blankLines = lines.filter(l => /^\s*$/.test(l)).length;
  const commentLines = lines.filter(l => /^\s*(\/\/|#|\/\*|\*|<!--)/.test(l)).length;

  // Cyclomatic complexity: count decision points
  const decisionPatterns = [
    /\bif\b/g, /\belse\s+if\b/g, /\belif\b/g, /\bfor\b/g, /\bwhile\b/g,
    /\bcase\b/g, /\bcatch\b/g, /\band\b/g, /\bor\b/g, /\?\?/g, /&&/g, /\|\|/g,
  ];
  let cyclomaticComplexity = 1;
  for (const pattern of decisionPatterns) {
    const matches = code.match(pattern);
    cyclomaticComplexity += matches ? matches.length : 0;
  }

  // Cognitive complexity: penalize nesting
  let cognitiveComplexity = 0;
  let nestingDepth = 0;
  let maxNestingDepth = 0;
  for (const line of lines) {
    const opens = (line.match(/\{|\(/g) ?? []).length;
    const closes = (line.match(/\}|\)/g) ?? []).length;
    nestingDepth = Math.max(0, nestingDepth + opens - closes);
    maxNestingDepth = Math.max(maxNestingDepth, nestingDepth);
    if (/\b(if|for|while|switch|catch)\b/.test(line)) {
      cognitiveComplexity += 1 + nestingDepth;
    }
  }

  // Count functions
  const functionMatches = code.match(/\b(function|def|fn|func)\s+\w+|\w+\s*=\s*(async\s+)?\(.*\)\s*=>/g);
  const functionCount = functionMatches ? functionMatches.length : 0;
  const averageFunctionLength = functionCount > 0 ? Math.round(linesOfCode / functionCount) : linesOfCode;

  return {
    linesOfCode,
    blankLines,
    commentLines,
    cyclomaticComplexity,
    cognitiveComplexity,
    maxNestingDepth,
    functionCount,
    averageFunctionLength,
  };
}

// ── Security Vulnerability Detection ─────────────────────────────────────────

export interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  description: string;
  line?: number;
  recommendation: string;
}

const SECURITY_PATTERNS: Array<{
  pattern: RegExp;
  severity: SecurityIssue["severity"];
  category: string;
  description: string;
  recommendation: string;
}> = [
  {
    pattern: /eval\s*\(/,
    severity: "critical",
    category: "Code Injection",
    description: "Use of eval() can execute arbitrary code and is a major security risk.",
    recommendation: "Use JSON.parse() for JSON data, or restructure code to avoid eval().",
  },
  {
    pattern: /innerHTML\s*=/,
    severity: "high",
    category: "XSS",
    description: "Setting innerHTML directly can lead to Cross-Site Scripting (XSS) attacks.",
    recommendation: "Use textContent or DOMPurify.sanitize() before setting innerHTML.",
  },
  {
    pattern: /document\.write\s*\(/,
    severity: "high",
    category: "XSS",
    description: "document.write() can introduce XSS vulnerabilities.",
    recommendation: "Use DOM manipulation methods like appendChild() or innerHTML with sanitization.",
  },
  {
    pattern: /\bpassword\s*=\s*['"][^'"]{6,}['"]/i,
    severity: "critical",
    category: "Hardcoded Credentials",
    description: "Hardcoded password detected in source code.",
    recommendation: "Use environment variables or a secrets manager instead.",
  },
  {
    pattern: /\bapiKey\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/i,
    severity: "critical",
    category: "Hardcoded Secret",
    description: "Hardcoded API key detected in source code.",
    recommendation: "Store API keys in environment variables (.env files) and never commit them.",
  },
  {
    pattern: /sql`[^`]*\$\{[^}]+\}`|['"]SELECT.*\+.*['"]|['"]INSERT.*\+.*['"]/i,
    severity: "high",
    category: "SQL Injection",
    description: "Potential SQL injection: dynamic values concatenated into SQL string.",
    recommendation: "Use parameterized queries or an ORM (Drizzle, Prisma) instead of string concatenation.",
  },
  {
    pattern: /md5\s*\(|sha1\s*\(|crypt\s*\(/,
    severity: "high",
    category: "Weak Cryptography",
    description: "Use of weak/broken hashing algorithm (MD5, SHA1) for sensitive data.",
    recommendation: "Use bcrypt, argon2, or scrypt for password hashing. Use SHA-256+ for data integrity.",
  },
  {
    pattern: /Math\.random\s*\(\)/,
    severity: "medium",
    category: "Weak Randomness",
    description: "Math.random() is not cryptographically secure.",
    recommendation: "Use crypto.getRandomValues() or Node's crypto.randomBytes() for security-sensitive values.",
  },
  {
    pattern: /cors\(\s*\)|\borigin:\s*['"]\*['"]/,
    severity: "medium",
    category: "CORS Misconfiguration",
    description: "Wildcard CORS policy allows any origin to access your API.",
    recommendation: "Specify allowed origins explicitly: cors({ origin: ['https://yourdomain.com'] })",
  },
  {
    pattern: /console\.log\s*\(.*password|console\.log\s*\(.*token|console\.log\s*\(.*secret/i,
    severity: "medium",
    category: "Sensitive Data Logging",
    description: "Potentially logging sensitive credentials to console.",
    recommendation: "Never log passwords, tokens, or secrets. Sanitize log data.",
  },
  {
    pattern: /http:\/\/(?!localhost)/,
    severity: "low",
    category: "Insecure Transport",
    description: "HTTP (not HTTPS) URL detected — data transmitted unencrypted.",
    recommendation: "Use HTTPS for all production URLs.",
  },
  {
    pattern: /\bprocess\.env\.NODE_ENV\s*!==?\s*['"]production['"]|NODE_ENV\s*===\s*['"]development['"]/,
    severity: "low",
    category: "Environment Check",
    description: "Code has development-only paths that may bypass security in production.",
    recommendation: "Ensure debug paths, verbose logging, and relaxed security are strictly gated to development.",
  },
];

export function detectSecurityIssues(code: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = code.split("\n");

  for (const sig of SECURITY_PATTERNS) {
    if (sig.pattern.test(code)) {
      let lineNumber: number | undefined;
      for (let i = 0; i < lines.length; i++) {
        if (sig.pattern.test(lines[i])) {
          lineNumber = i + 1;
          break;
        }
      }
      issues.push({ ...sig, line: lineNumber });
    }
  }

  return issues;
}

// ── Performance Anti-Pattern Detection ───────────────────────────────────────

export interface PerformanceIssue {
  severity: "high" | "medium" | "low";
  category: string;
  description: string;
  recommendation: string;
}

const PERFORMANCE_PATTERNS: Array<{
  pattern: RegExp;
  severity: PerformanceIssue["severity"];
  category: string;
  description: string;
  recommendation: string;
}> = [
  {
    pattern: /for\s*\(.*\)\s*\{[\s\S]{0,200}await/,
    severity: "high",
    category: "Sequential Async in Loop",
    description: "Awaiting promises inside a for loop runs them sequentially instead of in parallel.",
    recommendation: "Use Promise.all() with .map() to run async operations concurrently.",
  },
  {
    pattern: /\.forEach\s*\([^)]*async/,
    severity: "high",
    category: "Async forEach",
    description: "forEach doesn't await async callbacks — iterations run without waiting.",
    recommendation: "Use for...of with await, or Promise.all(array.map(async item => ...)).",
  },
  {
    pattern: /useEffect\s*\(\s*async/,
    severity: "high",
    category: "Async useEffect",
    description: "useEffect callback cannot be async — the returned Promise is ignored.",
    recommendation: "Define an async function inside useEffect and call it immediately.",
  },
  {
    pattern: /\.filter\(.*\)\.map\(|\.map\(.*\)\.filter\(/,
    severity: "medium",
    category: "Chained Array Methods",
    description: "Chaining .filter().map() or .map().filter() iterates the array twice.",
    recommendation: "Combine into a single .reduce() or use a for loop for large arrays.",
  },
  {
    pattern: /JSON\.parse\(JSON\.stringify\(/,
    severity: "medium",
    category: "Deep Clone Anti-Pattern",
    description: "JSON.parse(JSON.stringify()) is slow for deep cloning and breaks Dates, functions, undefined.",
    recommendation: "Use structuredClone() (Node 17+) or a library like lodash.clonedeep.",
  },
  {
    pattern: /new RegExp\([^)]+\)/,
    severity: "low",
    category: "Dynamic RegExp in Hot Path",
    description: "Creating RegExp objects dynamically in frequently called code is slow.",
    recommendation: "Pre-compile regular expressions outside loops or component render functions.",
  },
  {
    pattern: /document\.querySelector|document\.getElementById/,
    severity: "low",
    category: "DOM Queries in Render",
    description: "Direct DOM queries may bypass React's virtual DOM — use refs instead.",
    recommendation: "Use useRef() to reference DOM elements in React components.",
  },
];

export function detectPerformanceIssues(code: string): PerformanceIssue[] {
  return PERFORMANCE_PATTERNS.filter(sig => sig.pattern.test(code)).map(({ pattern: _, ...rest }) => rest);
}

// ── Code Quality Score ────────────────────────────────────────────────────────

export interface CodeQualityScore {
  overall: number;
  breakdown: {
    complexity: number;
    security: number;
    performance: number;
    documentation: number;
    style: number;
  };
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
}

export function calculateCodeQuality(
  code: string,
  complexity: ComplexityMetrics,
  securityIssues: SecurityIssue[],
  performanceIssues: PerformanceIssue[]
): CodeQualityScore {
  // Complexity score (0-100): lower complexity = higher score
  const complexityScore = Math.max(0, 100 - complexity.cyclomaticComplexity * 3 - complexity.maxNestingDepth * 5);

  // Security score (0-100): penalize based on severity
  const securityPenalty = securityIssues.reduce((p, i) => {
    return p + (i.severity === "critical" ? 30 : i.severity === "high" ? 20 : i.severity === "medium" ? 10 : 5);
  }, 0);
  const securityScore = Math.max(0, 100 - securityPenalty);

  // Performance score
  const perfPenalty = performanceIssues.reduce((p, i) => {
    return p + (i.severity === "high" ? 20 : i.severity === "medium" ? 10 : 5);
  }, 0);
  const performanceScore = Math.max(0, 100 - perfPenalty);

  // Documentation score: ratio of comment lines to code lines
  const docRatio = complexity.commentLines / Math.max(1, complexity.linesOfCode - complexity.blankLines);
  const documentationScore = Math.min(100, docRatio * 400);

  // Style score: heuristics for consistent style
  const lines = code.split("\n");
  const inconsistentIndent = lines.filter(l => /^\t+ /.test(l) || /^ +\t/.test(l)).length;
  const longLines = lines.filter(l => l.length > 120).length;
  const styleScore = Math.max(0, 100 - inconsistentIndent * 5 - longLines * 2);

  const overall = Math.round(
    complexityScore * 0.25 +
    securityScore * 0.35 +
    performanceScore * 0.2 +
    documentationScore * 0.1 +
    styleScore * 0.1
  );

  const grade = overall >= 90 ? "A" : overall >= 75 ? "B" : overall >= 60 ? "C" : overall >= 45 ? "D" : "F";
  const summary = grade === "A" ? "Excellent code quality" :
    grade === "B" ? "Good code with minor improvements possible" :
    grade === "C" ? "Average code — several areas to improve" :
    grade === "D" ? "Below average — significant issues found" :
    "Poor quality — major refactoring recommended";

  return {
    overall,
    breakdown: { complexity: complexityScore, security: securityScore, performance: performanceScore, documentation: documentationScore, style: styleScore },
    grade,
    summary,
  };
}

// ── Full Code Analysis ────────────────────────────────────────────────────────

export interface CodeAnalysisResult {
  language: LanguageDetectionResult;
  complexity: ComplexityMetrics;
  security: SecurityIssue[];
  performance: PerformanceIssue[];
  quality: CodeQualityScore;
}

export function analyzeCode(code: string): CodeAnalysisResult {
  const language = detectLanguage(code);
  const complexity = calculateComplexity(code);
  const security = detectSecurityIssues(code);
  const performance = detectPerformanceIssues(code);
  const quality = calculateCodeQuality(code, complexity, security, performance);

  return { language, complexity, security, performance, quality };
}
