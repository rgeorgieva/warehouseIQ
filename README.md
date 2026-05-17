# warehouseIQ

**The Intelligent Warehouse & Inventory Orchestrator** — a full-stack automation system for GlobalLogistics Corp.

Real-time inventory dashboard with low-stock alerts and an AI Operations Specialist that can query the live database (via Supabase MCP) and answer technical questions from product manuals (via RAG).

> Encorp AI Academy 2026 — exam project (2026-05-17)

---

## Stack

| Layer       | Technology                                                  |
|-------------|-------------------------------------------------------------|
| Frontend    | Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui |
| Backend     | n8n (self-hosted, Docker Compose)                           |
| Database    | Supabase Postgres + `pgvector`                              |
| AI Models   | OpenAI `gpt-4o-mini` · `text-embedding-3-small` (1536 dim)  |
| Integration | Supabase MCP Server · Supabase Vector Store                 |

---

## Architecture

```
Browser ─▶ Next.js (App Router)
              │
              │  Server Route Handlers  (adds x-webhook-secret)
              ▼
          n8n  (self-hosted)
            ├── Webhook workflows  (inventory CRUD, health-check, chat)
            ├── AI Agent           (MCP tool + Vector Store tool + Simple Memory)
            └── Error Trigger workflow
              │
              ▼
          Supabase  (Postgres + pgvector)
            ├── inventory
            ├── order_logs
            ├── product_manuals  (RAG)
            └── error_logs
```

The browser **never** talks to n8n or Supabase directly. All traffic is proxied through Next.js route handlers, which inject the shared webhook secret.

---

## Local setup

### 1. Supabase

1. Create a new Supabase project.
2. Open **SQL Editor** and run the files in this order:
   - `db/schema.sql`
   - `db/seed_inventory.sql`
   - `db/seed_manuals_raw.sql`
3. Note the **direct Postgres connection string** (Settings → Database). You will paste it into n8n's Postgres credential.

### 2. n8n

1. Make sure your self-hosted n8n is **≥ 1.74** (required for the MCP Client node).
2. In n8n, create credentials:
   - **Postgres** → paste the Supabase connection string from step 1.
   - **OpenAI** → your API key (used by chat model + embeddings).
   - **Supabase MCP** → see [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp). The MCP server URL & service-role key are configured on the MCP Client node.
3. Import the workflow JSONs from `n8n/` in this order:
   1. `01-inventory-list.json`
   2. `02-inventory-health-check.json`
   3. `03-inventory-operation.json`
   4. `04-ai-agent-chat.json`
   5. `05-manuals-ingest.json`  ← run once, then disable
   6. `06-error-workflow.json`  ← then set this as the "Error Workflow" on workflows 01–04 (Settings → Error Workflow)
4. Set the `WEBHOOK_SECRET` environment variable in your n8n container — every workflow's first node validates `x-webhook-secret`.
5. **Run `05-manuals-ingest.json` once.** This reads `manuals_raw`, generates embeddings and populates `product_manuals`. Confirm with `select count(*) from product_manuals;` — you should see ~5+ rows (more if chunking splits long entries).

### 3. Frontend (Next.js)

```powershell
Copy-Item .env.example .env.local
# Fill in N8N_BASE_URL and N8N_WEBHOOK_SECRET, or leave them empty to run in
# **mock mode** — the UI is fully usable offline with seed data baked in.
npm install
npm run dev
```

Open http://localhost:3000.

### Mock mode

If `N8N_BASE_URL` is not set, every API route falls back to `lib/mock.ts`, which
ships the same seed data as `db/seed_inventory.sql` and reproduces every
business outcome (`success`, `below_reorder`, `insufficient`, validation
errors, agent jailbreak refusal). This lets you demo the UI without n8n running.
The status pill in the top-right reads **mock mode** when the fallback is active.

---

## n8n endpoint contracts

See [`docs/n8n-endpoints.md`](docs/n8n-endpoints.md) for the complete request/response shape of every webhook.

Quick reference (all `POST`, `Content-Type: application/json`, header `x-webhook-secret`):

| Endpoint                          | Purpose                                            |
|-----------------------------------|----------------------------------------------------|
| `/webhook/inventory/list`         | All inventory rows                                 |
| `/webhook/inventory/health-check` | Items with `stock_level < reorder_point`           |
| `/webhook/inventory/operation`    | Inbound/outbound + auto-log                        |
| `/webhook/chat`                   | AI Agent reply (MCP + RAG + memory by session_id)  |

---

## Deliverables map

| Rubric criterion (points)              | Where                                          |
|----------------------------------------|------------------------------------------------|
| Database Mastery (25)                  | `db/schema.sql`, `db/seed_*.sql`               |
| Agent & MCP (30)                       | `n8n/04-ai-agent-chat.json`                    |
| Vibecoding (25)                        | `app/`, `components/`                          |
| Robustness — Error + Jailbreak (20)    | `n8n/06-error-workflow.json`, `docs/system-prompt.md` |

---

## Project structure

```
warehouseIQ/
├── app/                # Next.js App Router pages + route handlers
├── components/         # UI + feature components
├── lib/                # n8n client, helpers, session
├── db/                 # SQL files for Supabase
├── n8n/                # exported n8n workflow JSON files
├── docs/               # endpoint contracts, system prompt, screenshots
├── .env.example
└── README.md
```
