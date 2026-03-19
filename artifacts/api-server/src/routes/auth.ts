import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendAdminRegistrationRequest } from "../lib/email";

const router: IRouter = Router();

const COOKIE_NAME = "uid";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  signed: true,
};

function getUserId(req: Request): number | null {
  const raw = req.signedCookies?.[COOKIE_NAME];
  if (!raw) return null;
  const id = Number(raw);
  return Number.isNaN(id) ? null : id;
}

router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) { res.status(400).json({ error: "Name, email, and password are required" }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing.length > 0) { res.status(409).json({ error: "An account with this email already exists" }); return; }

    const passwordHash = await bcrypt.hash(password, 10);
    const allUsers = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
    const isFirstUser = allUsers.length === 0;

    const [user] = await db.insert(usersTable).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      isAdmin: isFirstUser,
      status: isFirstUser ? "approved" : "pending",
    } as any).returning();

    if (isFirstUser) {
      // First user (admin) — log in immediately
      res.cookie(COOKIE_NAME, String(user.id), COOKIE_OPTIONS);
      res.json({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, avatarUrl: (user as any).avatarUrl ?? null });
    } else {
      // All other users — send approval request to admin
      sendAdminRegistrationRequest({ id: user.id, name: user.name, email: user.email }).catch(() => {});
      res.status(202).json({ pending: true, message: "Your registration request has been submitted. You will receive an email once the admin approves your account." });
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: "Email and password are required" }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) { res.status(401).json({ error: "Invalid email or password" }); return; }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }

    const status = (user as any).status ?? "approved";
    if (status === "pending") {
      res.status(403).json({ error: "Your account is pending admin approval. You'll receive an email once approved.", pending: true });
      return;
    }
    if (status === "rejected") {
      res.status(403).json({ error: "Your account request was not approved. Please contact the administrator." });
      return;
    }

    res.cookie(COOKIE_NAME, String(user.id), COOKIE_OPTIONS);
    res.json({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, avatarUrl: (user as any).avatarUrl ?? null });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: COOKIE_OPTIONS.secure, sameSite: COOKIE_OPTIONS.sameSite });
  res.json({ ok: true });
});

router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    res.json({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, avatarUrl: (user as any).avatarUrl ?? null });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put("/auth/settings", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { name, currentPassword, newPassword } = req.body;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const updates: Partial<{ name: string; passwordHash: string }> = {};
    if (name && name.trim()) updates.name = name.trim();
    if (newPassword) {
      if (!currentPassword) { res.status(400).json({ error: "Current password is required" }); return; }
      if (newPassword.length < 6) { res.status(400).json({ error: "New password must be at least 6 characters" }); return; }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) { res.status(401).json({ error: "Current password is incorrect" }); return; }
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No changes provided" }); return; }
    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
    res.json({ id: updated.id, name: updated.name, email: updated.email, isAdmin: updated.isAdmin, avatarUrl: (updated as any).avatarUrl ?? null });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put("/auth/avatar", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { avatarUrl } = req.body;
  if (!avatarUrl || typeof avatarUrl !== "string") {
    res.status(400).json({ error: "avatarUrl is required" });
    return;
  }
  if (avatarUrl.length > 2_000_000) {
    res.status(413).json({ error: "Avatar image is too large (max 2MB)" });
    return;
  }
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ avatarUrl } as any)
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ avatarUrl: (updated as any).avatarUrl });
  } catch (err: any) {
    if (err.message?.includes("avatarUrl") || err.message?.includes("avatar_url") || err.code === "42703") {
      res.status(503).json({ error: "Avatar column not available. Run 'pnpm --filter @workspace/db run push' to apply the latest schema." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export { getUserId };
export default router;
