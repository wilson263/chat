# ZorvixAI - Full-Stack AI Chat App

## Overview

Full-stack AI chat application built on a pnpm workspace monorepo using TypeScript. Uses Groq AI (via `groq-sdk`) as the primary AI provider. All features from the original project are preserved: chat, code generation, agent builder, playground generator, auto-titling, and web search.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **AI Provider**: Groq (`groq-sdk`) — uses `GROQ_API_KEY` env secret
- **Secondary AI**: OpenAI (user-supplied key via localStorage)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
workspace/
├── artifacts/
│   ├── ai-coder/           # React + Vite frontend (iChat AI Coder)
│   └── api-server/         # Express API server
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-groq-ai/          # Groq AI client (lazy singleton)
│   ├── integrations-openai-ai-server/ # OpenAI server-side client
│   └── integrations-openai-ai-react/  # OpenAI React hooks
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## AI Integration

### Groq (Primary)
- Library: `lib/integrations-groq-ai` (`@workspace/integrations-groq-ai`)
- Client: lazy singleton proxy in `src/client.ts`, reads `GROQ_API_KEY`
- Models available: `llama-3.3-70b-versatile`, `llama-3.1-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `gemma2-9b-it`
- Default model: `llama-3.3-70b-versatile`
- API: OpenAI-compatible (`groq.chat.completions.create()`)

### OpenAI (Secondary)
- Requires user to supply their own API key (stored in `localStorage`)
- Models: `gpt-4o`, `gpt-4o-mini`, `o1-mini`, `o3-mini`

## Key API Routes

All routes mounted at `/api`:
- `POST /api/chat/message` — streaming chat with Groq
- `POST /api/chat/auto-title` — auto-generate conversation title
- `POST /api/chat/websearch` — web-search assisted chat
- `POST /api/chat/generate-image` — returns 501 (Groq doesn't support image gen)
- `POST /api/codegen` — code generation
- `POST /api/agent-build` — agent builder
- `POST /api/playground-generate` — playground generator
- `GET/POST /api/auth/*` — register, login, logout, session
- `GET/POST/DELETE /api/openai/conversations` — OpenAI-style conversation history

## Database Schema

Tables (Drizzle + PostgreSQL):
- `conversations`, `messages` — chat history
- `projects`, `project_files` — code workspace projects
- `users` — authentication
- `apps` — deployed/generated apps

Run schema push: `pnpm --filter @workspace/db run push`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` (`composite: true`). Always typecheck from root:
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
- `pnpm run build` — typecheck + recursive build

## Packages

### `artifacts/ai-coder` (`@workspace/ai-coder`)
React + Vite frontend. Pages: chat, dashboard, workspace, compare, playground, agent-builder, templates.
- Model selector defaults to Groq models
- `pnpm --filter @workspace/ai-coder run dev`

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API. Routes in `src/routes/`. Uses Groq for all AI operations.
- Entry: `src/index.ts`
- App: `src/app.ts` — mounts routes at `/api`
- `pnpm --filter @workspace/api-server run dev`
- `pnpm --filter @workspace/api-server run build` — esbuild bundle

### `lib/db` (`@workspace/db`)
Drizzle ORM + PostgreSQL. `DATABASE_URL` provided by Replit.

### `lib/integrations-groq-ai` (`@workspace/integrations-groq-ai`)
Groq AI lazy client. Reads `GROQ_API_KEY` from environment.

### `lib/api-client-react` (`@workspace/api-client-react`)
Generated React Query hooks from OpenAPI spec.

### `lib/api-zod` (`@workspace/api-zod`)
Generated Zod schemas from OpenAPI spec.
