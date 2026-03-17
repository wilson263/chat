import { Router, type IRouter } from "express";
import {
  ListGithubReposQueryParams,
  GetGithubRepoContentsParams,
  GetGithubRepoContentsQueryParams,
  GetGithubFileParams,
  GetGithubFileQueryParams,
  CommitToGithubBody,
  ImportGithubRepoBody,
  ListGithubReposResponse,
  GetGithubRepoContentsResponse,
  GetGithubFileResponse,
  CommitToGithubResponse,
  ImportGithubRepoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const LANG_MAP: Record<string, string> = {
  ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript", ".cjs": "javascript",
  ".ts": "typescript", ".tsx": "typescript", ".mts": "typescript",
  ".py": "python", ".pyw": "python",
  ".html": "html", ".htm": "html",
  ".css": "css", ".scss": "scss", ".sass": "scss", ".less": "css",
  ".json": "json", ".jsonc": "json",
  ".md": "markdown", ".mdx": "markdown",
  ".sh": "bash", ".bash": "bash", ".zsh": "bash",
  ".java": "java", ".kt": "kotlin", ".kts": "kotlin",
  ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp", ".c": "c", ".h": "c", ".hpp": "cpp",
  ".cs": "csharp", ".go": "go", ".rs": "rust",
  ".rb": "ruby", ".php": "php", ".swift": "swift",
  ".yaml": "yaml", ".yml": "yaml", ".toml": "plaintext", ".ini": "plaintext",
  ".env": "plaintext", ".txt": "plaintext", ".xml": "xml", ".sql": "sql",
  ".graphql": "graphql", ".gql": "graphql",
  ".dockerfile": "dockerfile", ".tf": "terraform",
  ".r": "r", ".lua": "lua", ".pl": "perl", ".scala": "scala",
  ".vue": "html", ".svelte": "html",
};

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".nuxt", "vendor", "__pycache__", ".venv", "venv", "coverage", ".cache"]);
const SKIP_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".ttf", ".woff", ".woff2", ".eot", ".otf", ".mp4", ".mp3", ".zip", ".tar", ".gz", ".lock", ".sum"]);

async function githubFetch(url: string, token?: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com${url}`, { ...options, headers: { ...headers, ...(options?.headers as Record<string, string> || {}) } });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API ${response.status}: ${error}`);
  }
  return response.json();
}

function detectLanguage(filePath: string): string {
  const ext = "." + filePath.split(".").pop()?.toLowerCase();
  return LANG_MAP[ext] || "plaintext";
}

function parseGithubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  try {
    const cleaned = url.replace(/\/$/, "").replace(/\.git$/, "");
    const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/);
    if (!match) return null;
    return { owner: match[1], repo: match[2], branch: match[3] };
  } catch {
    return null;
  }
}

router.post("/github/import-repo", async (req, res): Promise<void> => {
  const parsed = ImportGithubRepoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { repoUrl, token, branch: requestedBranch } = parsed.data;
  const parsed_url = parseGithubUrl(repoUrl);
  if (!parsed_url) {
    res.status(400).json({ error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" });
    return;
  }

  const { owner, repo, branch: urlBranch } = parsed_url;
  const targetBranch = requestedBranch || urlBranch;

  try {
    // Get repo info
    const repoInfo = await githubFetch(`/repos/${owner}/${repo}`, token);
    const defaultBranch = targetBranch || repoInfo.default_branch || "main";

    // Get recursive file tree
    const treeData = await githubFetch(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, token);
    const allFiles: Array<{ path: string; sha: string; size: number }> = treeData.tree
      .filter((item: any) => {
        if (item.type !== "blob") return false;
        const parts = item.path.split("/");
        if (parts.some((p: string) => SKIP_DIRS.has(p))) return false;
        const ext = "." + item.path.split(".").pop()?.toLowerCase();
        if (SKIP_EXTS.has(ext)) return false;
        if ((item.size || 0) > 300000) return false; // skip files >300KB
        return true;
      })
      .slice(0, 500); // max 500 files

    // Fetch file contents in batches of 10
    const importedFiles: Array<{ path: string; name: string; content: string; language: string }> = [];
    const batchSize = 10;
    for (let i = 0; i < allFiles.length; i += batchSize) {
      const batch = allFiles.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (file) => {
          const fileData = await githubFetch(`/repos/${owner}/${repo}/contents/${file.path}?ref=${defaultBranch}`, token);
          const content = Buffer.from(fileData.content, "base64").toString("utf-8");
          const name = file.path.split("/").pop() || file.path;
          return { path: file.path, name, content, language: detectLanguage(file.path) };
        })
      );
      for (const result of results) {
        if (result.status === "fulfilled") importedFiles.push(result.value);
      }
    }

    res.json(ImportGithubRepoResponse.parse({
      repoName: repoInfo.name,
      description: repoInfo.description || "",
      language: repoInfo.language || "javascript",
      files: importedFiles,
      totalFiles: allFiles.length,
      skippedFiles: treeData.tree.filter((i: any) => i.type === "blob").length - allFiles.length,
    }));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/github/repos", async (req, res): Promise<void> => {
  const query = ListGithubReposQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  try {
    const data = await githubFetch("/user/repos?per_page=100&sort=updated", query.data.token);
    const repos = data.map((r: any) => ({ id: r.id, name: r.name, fullName: r.full_name, description: r.description, private: r.private, language: r.language, updatedAt: r.updated_at, url: r.html_url }));
    res.json(ListGithubReposResponse.parse(repos));
  } catch (err: any) { res.status(401).json({ error: err.message }); }
});

router.get("/github/repos/:owner/:repo/contents", async (req, res): Promise<void> => {
  const params = GetGithubRepoContentsParams.safeParse(req.params);
  const query = GetGithubRepoContentsQueryParams.safeParse(req.query);
  if (!params.success || !query.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const { owner, repo } = params.data;
  const path = query.data.path || "";
  try {
    const data = await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, query.data.token);
    const items = Array.isArray(data) ? data : [data];
    const contents = items.map((item: any) => ({ name: item.name, path: item.path, type: item.type === "dir" ? "dir" : "file", size: item.size || 0, sha: item.sha }));
    res.json(GetGithubRepoContentsResponse.parse(contents));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/github/repos/:owner/:repo/file", async (req, res): Promise<void> => {
  const params = GetGithubFileParams.safeParse(req.params);
  const query = GetGithubFileQueryParams.safeParse(req.query);
  if (!params.success || !query.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const { owner, repo } = params.data;
  try {
    const data = await githubFetch(`/repos/${owner}/${repo}/contents/${query.data.path}`, query.data.token);
    res.json(GetGithubFileResponse.parse({ name: data.name, path: data.path, content: Buffer.from(data.content, "base64").toString("utf-8"), sha: data.sha, encoding: "utf-8" }));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/github/commit", async (req, res): Promise<void> => {
  const parsed = CommitToGithubBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { owner, repo, path, message, content, sha, token } = parsed.data;
  try {
    const body: any = { message, content: Buffer.from(content).toString("base64") };
    if (sha) body.sha = sha;
    const data = await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, token, { method: "PUT", body: JSON.stringify(body) });
    res.json(CommitToGithubResponse.parse({ sha: data.content.sha, url: data.content.html_url }));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
