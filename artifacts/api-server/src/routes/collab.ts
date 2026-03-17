import { Router, type Request, type Response } from "express";
import { getUserId } from "./auth";

const router = Router();

const COLORS = ["#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

interface PresenceUser {
  userId: number;
  name: string;
  color: string;
  cursor?: { line: number; column: number; fileId?: number };
  activeFile?: number;
  lastSeen: number;
}

const presenceStore = new Map<string, Map<number, PresenceUser>>();

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of presenceStore) {
    for (const [uid, user] of room) {
      if (now - user.lastSeen > 30000) room.delete(uid);
    }
    if (room.size === 0) presenceStore.delete(roomId);
  }
}, 10000);

router.post("/collab/presence/:projectId", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { name, cursor, activeFile } = req.body;
  const pid = req.params.projectId;
  if (!presenceStore.has(pid)) presenceStore.set(pid, new Map());
  const room = presenceStore.get(pid)!;
  room.set(userId, {
    userId,
    name: name || "Anonymous",
    color: COLORS[userId % COLORS.length],
    cursor,
    activeFile,
    lastSeen: Date.now(),
  });
  res.json({ ok: true, color: COLORS[userId % COLORS.length] });
});

router.get("/collab/presence/:projectId", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const room = presenceStore.get(req.params.projectId);
  if (!room) { res.json([]); return; }
  const users = Array.from(room.values()).filter(u => u.userId !== userId && Date.now() - u.lastSeen < 30000);
  res.json(users);
});

router.delete("/collab/presence/:projectId", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (userId) {
    const room = presenceStore.get(req.params.projectId);
    if (room) room.delete(userId);
  }
  res.json({ ok: true });
});

export default router;
