import { Router, type Request, type Response } from "express";
import { getUserId } from "./auth";

const router = Router();

async function ghFetch(url: string, token?: string, opts?: RequestInit) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts?.headers as Record<string, string> || {}),
  };
  const r = await fetch(`https://api.github.com${url}`, { ...opts, headers });
  if (!r.ok) { const e = await r.text(); throw new Error(`GitHub ${r.status}: ${e}`); }
  return r.json();
}

router.get("/gitops/:owner/:repo/branches", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { owner, repo } = req.params;
  const token = req.query.token as string | undefined;
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/branches?per_page=50`, token);
    res.json(data.map((b: any) => ({ name: b.name, sha: b.commit.sha, protected: b.protected })));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/gitops/:owner/:repo/commits", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { owner, repo } = req.params;
  const token = req.query.token as string | undefined;
  const branch = req.query.branch as string || "main";
  const perPage = Math.min(50, parseInt(String(req.query.per_page || "20")));
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}`, token);
    res.json(data.map((c: any) => ({
      sha: c.sha, shortSha: c.sha.slice(0, 7),
      message: c.commit.message,
      author: c.commit.author.name,
      email: c.commit.author.email,
      date: c.commit.author.date,
      url: c.html_url,
    })));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/gitops/:owner/:repo/compare", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { owner, repo } = req.params;
  const token = req.query.token as string | undefined;
  const { base, head } = req.query;
  if (!base || !head) { res.status(400).json({ error: "base and head required" }); return; }
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/compare/${base}...${head}`, token);
    res.json({
      status: data.status, aheadBy: data.ahead_by, behindBy: data.behind_by,
      files: data.files?.map((f: any) => ({ filename: f.filename, status: f.status, additions: f.additions, deletions: f.deletions, patch: f.patch })) || [],
    });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/gitops/:owner/:repo/create-branch", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { owner, repo } = req.params;
  const { token, branchName, fromSha } = req.body;
  if (!token || !branchName || !fromSha) { res.status(400).json({ error: "token, branchName, fromSha required" }); return; }
  try {
    await ghFetch(`/repos/${owner}/${repo}/git/refs`, token, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha }),
    });
    res.json({ ok: true, branch: branchName });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/gitops/:owner/:repo/pull-requests", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { owner, repo } = req.params;
  const token = req.query.token as string | undefined;
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/pulls?state=open&per_page=20`, token);
    res.json(data.map((p: any) => ({
      number: p.number, title: p.title,
      head: p.head.ref, base: p.base.ref,
      author: p.user.login, state: p.state,
      createdAt: p.created_at, url: p.html_url,
    })));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
