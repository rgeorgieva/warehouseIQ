# n8n workflows

Backup JSON exports — import in this order:

| # | File                          | Webhook path                  | Notes                                                                 |
|---|-------------------------------|-------------------------------|-----------------------------------------------------------------------|
| 1 | `01-inventory-list.json`      | `POST /webhook/inventory/list`         | Returns all inventory rows.                                  |
| 2 | `02-inventory-health-check.json` | `POST /webhook/inventory/health-check` | Items where `stock_level < reorder_point`.                |
| 3 | `03-inventory-operation.json` | `POST /webhook/inventory/operation`    | Inbound/outbound + log + business-rule branches.             |
| 4 | `04-ai-agent-chat.json`       | `POST /webhook/chat`                    | AI Agent with MCP + Vector Store + Simple Memory.            |
| 5 | `05-manuals-ingest.json`      | manual trigger                          | One-shot — embed `manuals_raw` rows into `product_manuals`. |
| 6 | `06-error-workflow.json`      | Error Trigger                           | Set this as the **Error Workflow** for workflows 01-04.      |

## After import

For each workflow:

1. Open it and replace credentials marked `REPLACE_ME`:
   - **Postgres** → your Supabase connection string (Settings → Database → Direct connection).
   - **OpenAI** → your API key (workflows 04 and 05).
   - **Supabase API** → URL + service-role key (workflows 04 and 05).
   - **MCP Client** → Supabase MCP server (workflow 04). Add a connector for the Supabase Hosted MCP server with read+write scope on `inventory` and `order_logs`.
2. In **Settings → Variables / Env** set `WEBHOOK_SECRET` to the same value as `N8N_WEBHOOK_SECRET` in the frontend's `.env.local`.
3. Activate workflows 01–04.
4. Execute workflow 05 manually **once** to populate the vector store, then disable it.
5. Open each of workflows 01–04 and in **Workflow Settings → Error Workflow** select **warehouseIQ — 06 Error Workflow**.

## Quick smoke test

```bash
curl -sS -X POST "$N8N_BASE_URL/inventory/list" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $N8N_WEBHOOK_SECRET" \
  -d '{}' | jq .
```

You should get an `ok: true` payload with an `items` array.

## Notes / caveats

- The `position` coordinates in these JSONs are approximate — feel free to re-layout in the canvas.
- The `mcpClientTool` node type and `vectorStoreSupabase` "Retrieve as Tool" require n8n **≥ 1.74**. If your version is older, either update n8n or replace the MCP node with an HTTP Request tool pointing to Supabase REST + RPC.
- All workflows reply with HTTP 200 even on business failures. Use the `ok` field to distinguish.
