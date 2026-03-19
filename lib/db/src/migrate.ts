import { sql } from "drizzle-orm";
import { db, pool } from "./index";

/**
 * Runs auto-migration to ensure all required tables exist in the database.
 * Called on server startup so the app works even on fresh Render deployments
 * without needing to manually run drizzle-kit push.
 *
 * Uses the SAME pool as the main db connection — no SSL or connection issues.
 * This creates tables only if they do not already exist — safe to call repeatedly.
 */
export async function runMigrations(): Promise<void> {
  console.log("[migrate] Starting auto-migration...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── users ─────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"            SERIAL PRIMARY KEY,
        "name"          TEXT NOT NULL,
        "email"         TEXT NOT NULL UNIQUE,
        "password_hash" TEXT NOT NULL,
        "is_admin"      BOOLEAN NOT NULL DEFAULT FALSE,
        "avatar_url"    TEXT,
        "status"        TEXT NOT NULL DEFAULT 'pending',
        "created_at"    TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[migrate] ✓ users table ready");

    // ── conversations ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id"         SERIAL PRIMARY KEY,
        "title"      TEXT NOT NULL,
        "user_id"    INTEGER,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[migrate] ✓ conversations table ready");

    // ── messages ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id"              SERIAL PRIMARY KEY,
        "conversation_id" INTEGER NOT NULL
          REFERENCES "conversations"("id") ON DELETE CASCADE,
        "role"            TEXT NOT NULL,
        "content"         TEXT NOT NULL,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[migrate] ✓ messages table ready");

    // ── projects ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id"          SERIAL PRIMARY KEY,
        "name"        TEXT NOT NULL,
        "description" TEXT,
        "user_id"     INTEGER,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[migrate] ✓ projects table ready");

    // ── project_files ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "project_files" (
        "id"         SERIAL PRIMARY KEY,
        "project_id" INTEGER NOT NULL
          REFERENCES "projects"("id") ON DELETE CASCADE,
        "path"       TEXT NOT NULL,
        "content"    TEXT NOT NULL DEFAULT '',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[migrate] ✓ project_files table ready");

    // ── apps ──────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "apps" (
        "id"          SERIAL PRIMARY KEY,
        "name"        TEXT NOT NULL,
        "description" TEXT,
        "user_id"     INTEGER,
        "html"        TEXT NOT NULL DEFAULT '',
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[migrate] ✓ apps table ready");

    // ── conversation_summaries ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "conversation_summaries" (
        "id"              SERIAL PRIMARY KEY,
        "conversation_id" INTEGER NOT NULL UNIQUE
          REFERENCES "conversations"("id") ON DELETE CASCADE,
        "summary"         TEXT NOT NULL,
        "message_count"   INTEGER NOT NULL DEFAULT 0,
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[migrate] ✓ conversation_summaries table ready");

    // ── ai_memory ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ai_memory" (
        "id"         SERIAL PRIMARY KEY,
        "user_id"    INTEGER NOT NULL,
        "key"        TEXT NOT NULL,
        "value"      TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("user_id", "key")
      )
    `);
    console.log("[migrate] ✓ ai_memory table ready");

    // ── code_reviews ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "code_reviews" (
        "id"         SERIAL PRIMARY KEY,
        "user_id"    INTEGER,
        "language"   TEXT NOT NULL DEFAULT 'unknown',
        "code_hash"  TEXT NOT NULL,
        "review"     TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("[migrate] ✓ code_reviews table ready");

    await client.query("COMMIT");
    console.log("[migrate] ✅ Auto-migration complete. All tables are ready.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[migrate] ❌ Migration failed:", err);
    throw err;
  } finally {
    client.release();
  }
}
