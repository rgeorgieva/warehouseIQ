-- ============================================================================
-- warehouseIQ — Supabase schema
-- Run this once in the Supabase SQL Editor on a fresh project.
-- After running this, run db/seed_inventory.sql and db/seed_manuals_raw.sql.
-- ============================================================================

-- Required extensions
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- 1) inventory
-- ---------------------------------------------------------------------------
create table if not exists public.inventory (
  id             bigserial primary key,
  item_name      text not null,
  category       text not null,
  stock_level    integer not null default 0 check (stock_level >= 0),
  reorder_point  integer not null default 0 check (reorder_point >= 0),
  price          numeric(10,2) not null default 0,
  supplier_email text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists inventory_item_name_uniq
  on public.inventory (lower(item_name));

-- Auto-update updated_at on row change
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_inventory_updated_at on public.inventory;
create trigger trg_inventory_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) order_logs
-- ---------------------------------------------------------------------------
create table if not exists public.order_logs (
  id         bigserial primary key,
  item_name  text not null,
  category   text,
  price      numeric(10,2),
  quantity   integer not null,
  action     text not null check (action in ('inbound','outbound')),
  timestamp  timestamptz not null default now()
);
create index if not exists order_logs_item_ts
  on public.order_logs (item_name, timestamp desc);
create index if not exists order_logs_action_ts
  on public.order_logs (action, timestamp desc);

-- ---------------------------------------------------------------------------
-- 3) product_manuals  (RAG vector store)
-- Default schema expected by n8n Supabase Vector Store node.
-- Embedding dimension = 1536  (OpenAI text-embedding-3-small).
-- ---------------------------------------------------------------------------
create table if not exists public.product_manuals (
  id        bigserial primary key,
  content   text,
  metadata  jsonb,
  embedding vector(1536)
);
create index if not exists product_manuals_embedding_ivfflat
  on public.product_manuals
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Retrieval function used by n8n Supabase Vector Store (Retrieve as Tool)
create or replace function public.match_documents (
  query_embedding vector(1536),
  match_count int default 5,
  filter jsonb default '{}'::jsonb
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql as $$
begin
  return query
  select
    pm.id,
    pm.content,
    pm.metadata,
    1 - (pm.embedding <=> query_embedding) as similarity
  from public.product_manuals pm
  where pm.metadata @> filter
  order by pm.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) manuals_raw  (temporary staging table; cleared after embeddings are built)
-- ---------------------------------------------------------------------------
create table if not exists public.manuals_raw (
  id            bigserial primary key,
  product_name  text not null,
  category      text,
  content       text not null,
  version       text,
  last_updated  date
);

-- ---------------------------------------------------------------------------
-- 5) n8n_chat_histories  (optional — for Postgres-backed chat memory)
-- ---------------------------------------------------------------------------
create table if not exists public.n8n_chat_histories (
  id         bigserial primary key,
  session_id text not null,
  message    jsonb not null
);
create index if not exists n8n_chat_histories_session_id
  on public.n8n_chat_histories (session_id);

-- ---------------------------------------------------------------------------
-- 6) error_logs  (used by the Error Trigger workflow)
-- ---------------------------------------------------------------------------
create table if not exists public.error_logs (
  id            bigserial primary key,
  workflow_name text,
  node_name     text,
  error_message text,
  payload       jsonb,
  created_at    timestamptz not null default now()
);
