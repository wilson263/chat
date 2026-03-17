import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, projectFilesTable } from "@workspace/db";
import {
  ListFilesParams,
  CreateFileParams,
  CreateFileBody,
  GetFileParams,
  UpdateFileParams,
  UpdateFileBody,
  DeleteFileParams,
  ListFilesResponse,
  GetFileResponse,
  UpdateFileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/files/:projectId", async (req, res): Promise<void> => {
  const params = ListFilesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, params.data.projectId));
  res.json(ListFilesResponse.parse(files));
});

router.post("/files/:projectId", async (req, res): Promise<void> => {
  const params = CreateFileParams.safeParse(req.params);
  const body = CreateFileBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [file] = await db.insert(projectFilesTable).values({ ...body.data, projectId: params.data.projectId, content: body.data.content ?? "" }).returning();
  res.status(201).json(file);
});

router.get("/files/:projectId/:fileId", async (req, res): Promise<void> => {
  const params = GetFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [file] = await db.select().from(projectFilesTable).where(
    and(eq(projectFilesTable.id, params.data.fileId), eq(projectFilesTable.projectId, params.data.projectId))
  );
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.json(GetFileResponse.parse(file));
});

router.put("/files/:projectId/:fileId", async (req, res): Promise<void> => {
  const params = UpdateFileParams.safeParse(req.params);
  const body = UpdateFileBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [file] = await db.update(projectFilesTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(and(eq(projectFilesTable.id, params.data.fileId), eq(projectFilesTable.projectId, params.data.projectId)))
    .returning();
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.json(UpdateFileResponse.parse(file));
});

router.delete("/files/:projectId/:fileId", async (req, res): Promise<void> => {
  const params = DeleteFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [file] = await db.delete(projectFilesTable)
    .where(and(eq(projectFilesTable.id, params.data.fileId), eq(projectFilesTable.projectId, params.data.projectId)))
    .returning();
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
