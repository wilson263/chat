import pg from "pg";

const { Pool } = pg;

/**
 * Runs auto-migration to ensure all required tables exist in the database.
 * Called on server startup so the app works even on fresh Render deployments
 * without needing to manually run drizzle-kit push.
 *
 * This creates tables only if they do not already exist — safe to call repeatedly.
 */
export async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Cannot run migrations.");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    console.log("[migrate] Starting auto-migration...");

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

    // ── conversations ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id"         SERIAL PRIMARY KEY,
        "title"      TEXT NOT NULL,
        "user_id"    INTEGER,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

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

    // ── conversation_summaries (new — for AI memory) ─────────────────────────
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

    // ── ai_memory (new — persistent facts the AI remembers per user) ──────────
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

    // ── code_reviews (new — stored code review results) ──────────────────────
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

    await client.query("COMMIT");
    console.log("[migrate] Auto-migration complete. All tables are ready.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[migrate] Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}
