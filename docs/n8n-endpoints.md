# n8n Webhook Endpoints — Contract Reference

All webhooks share these properties:

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Required header:** `x-webhook-secret: <N8N_WEBHOOK_SECRET>`
- **Base URL:** value of `N8N_BASE_URL` (e.g. `http://localhost:5678/webhook`)
- **Responses are always HTTP 200.** Business-level failures are signalled by `ok: false` in the body.

The Next.js layer hides the webhook URL and secret from the browser — clients only talk to `/api/...` route handlers, which forward to n8n.

---

## 1. `POST /webhook/inventory/list`

Returns every row in `inventory`.

**Request:**
```http
POST /webhook/inventory/list
x-webhook-secret: <secret>

{}
```

**Response 200:**
```json
{
  "ok": true,
  "items": [
    {
      "id": 1,
      "item_name": "X-1000 Power Processor",
      "category": "Electronics",
      "stock_level": 12,
      "reorder_point": 15,
      "price": 299.99,
      "supplier_email": "support@techparts.com",
      "below_reorder": true
    }
  ]
}
```

**n8n implementation:** Webhook → IF (`headers['x-webhook-secret'] == env.WEBHOOK_SECRET`) → Postgres:

```sql
select id, item_name, category, stock_level, reorder_point, price, supplier_email,
       (stock_level < reorder_point) as below_reorder
from public.inventory
order by id;
```
→ Aggregate → Respond.

---

## 2. `POST /webhook/inventory/health-check`

Returns only items below their reorder point. Used by the Low-Stock page and by the dashboard "At risk" widget.

**Request:**
```http
POST /webhook/inventory/health-check
x-webhook-secret: <secret>

{}
```

**Response 200:**
```json
{
  "ok": true,
  "low_stock_count": 2,
  "items": [
    {
      "id": 3,
      "item_name": "High-Speed Cooling Fan",
      "category": "Components",
      "stock_level": 3,
      "reorder_point": 10,
      "shortage": 7,
      "price": 15.25,
      "supplier_email": "info@coolingsys.net"
    }
  ]
}
```

**n8n implementation:** Webhook → secret check → Postgres:

```sql
select id, item_name, category, stock_level, reorder_point,
       (reorder_point - stock_level) as shortage,
       price, supplier_email
from public.inventory
where stock_level < reorder_point
order by shortage desc;
```
→ Aggregate (collect `items` + `low_stock_count = $count`) → Respond.

---

## 3. `POST /webhook/inventory/operation`

Inbound (add stock) or outbound (remove stock). Always logs to `order_logs` on success.

**Request:**
```json
{
  "item_id": 2,
  "action": "outbound",
  "quantity": 10
}
```

| Field      | Type    | Required | Notes                                       |
|------------|---------|----------|---------------------------------------------|
| `item_id`  | integer | yes      | Primary key in `inventory`                  |
| `action`   | enum    | yes      | `"inbound"` or `"outbound"`                 |
| `quantity` | integer | yes      | Must be `> 0`                               |

### Possible responses

**a) `success`** — operation applied, stock still healthy:
```json
{
  "ok": true,
  "status": "success",
  "item": { "id": 2, "item_name": "G-Pro Graphics Card", "stock_level": 15, "reorder_point": 8 },
  "log_id": 142
}
```

**b) `insufficient`** — outbound rejected, stock unchanged:
```json
{
  "ok": false,
  "status": "insufficient",
  "message": "Requested 10 but only 5 available.",
  "item": { "id": 2, "item_name": "G-Pro Graphics Card", "stock_level": 5 },
  "requested": 10,
  "available": 5
}
```

**c) `below_reorder`** — outbound succeeded, but stock fell below reorder point:
```json
{
  "ok": true,
  "status": "below_reorder",
  "message": "Outbound completed. G-Pro Graphics Card is now below reorder point (3 < 8).",
  "item": { "id": 2, "item_name": "G-Pro Graphics Card", "stock_level": 3, "reorder_point": 8 },
  "log_id": 143
}
```

**d) `validation_error`:**
```json
{
  "ok": false,
  "status": "validation_error",
  "message": "quantity must be a positive integer"
}
```

**e) `error`** (uncaught exception, emitted by error-handling node):
```json
{
  "ok": false,
  "status": "error",
  "message": "Internal workflow error",
  "trace_id": "wf_abc123"
}
```

### n8n implementation outline

1. **Webhook** node.
2. **IF** node → header secret matches.
3. **Code (Validate)** — reject early on validation errors. Pseudocode:
   ```js
   const { item_id, action, quantity } = $input.first().json.body;
   if (!Number.isInteger(item_id) || item_id <= 0) throw 'invalid item_id';
   if (!['inbound','outbound'].includes(action))   throw 'invalid action';
   if (!Number.isInteger(quantity) || quantity <= 0) throw 'invalid quantity';
   return [{ json: { item_id, action, quantity } }];
   ```
4. **Postgres (Lock & Read)** — `select id, item_name, category, price, stock_level, reorder_point from public.inventory where id = $1 for update;` (param: `{{ $json.item_id }}`).
5. **Switch** on `action`:
   - **inbound branch:**
     1. Postgres update: `update public.inventory set stock_level = stock_level + $1 where id = $2 returning *;`
     2. Postgres insert into `order_logs(item_name, category, price, quantity, action)`.
     3. Respond with `status: "success"`.
   - **outbound branch:**
     1. **IF** `quantity > stock_level` → Respond `insufficient` (no mutation).
     2. **Else:**
        - Postgres update: `update public.inventory set stock_level = stock_level - $1 where id = $2 returning *;`
        - Postgres insert into `order_logs`.
        - **IF** `new.stock_level < reorder_point` → Respond `below_reorder`.
        - **Else** → Respond `success`.

> The `for update` lock on step 4 prevents race conditions if two outbound webhooks arrive simultaneously.

---

## 4. `POST /webhook/chat`

Forwards a user message to the AI Agent and returns the agent's reply. Memory is keyed by `session_id`.

**Request:**
```json
{
  "session_id": "sess_abc123",
  "message": "When was the last outbound for G-Pro Graphics Card?"
}
```

**Response 200:**
```json
{
  "ok": true,
  "session_id": "sess_abc123",
  "reply": "The last outbound operation for G-Pro Graphics Card was on 2026-05-15 at 14:32 UTC, for 3 units.",
  "tools_used": ["supabase_mcp"]
}
```

### n8n implementation outline

1. **Webhook** → secret check.
2. **AI Agent** (LangChain) node:
   - **Chat Model:** OpenAI `gpt-4o-mini` (temperature 0.2).
   - **Memory:** Simple Memory, `sessionIdKey = ={{ $json.body.session_id }}`, context window 10.
   - **System message:** see `docs/system-prompt.md`.
   - **Tools:**
     - **MCP Client Tool** → connected to the Supabase MCP Server credential. Allowed operations: `inventory` and `order_logs` (read + update).
     - **Supabase Vector Store Tool** (Retrieve as Tool) — table `product_manuals`, query function `match_documents`, OpenAI Embeddings (`text-embedding-3-small`), top_k 5. Tool description: *"Use when the user asks about product specifications, troubleshooting, calibration, firmware, warranty or maintenance from internal product manuals."*
3. **Respond to Webhook**:
   ```json
   {
     "ok": true,
     "session_id": "={{ $json.body.session_id }}",
     "reply":      "={{ $json.output }}"
   }
   ```

---

## 5. Error envelope

Whenever a workflow throws, the dedicated **Error Trigger workflow** (`n8n/06-error-workflow.json`) captures it and writes a row to `error_logs`. Each main workflow also has a "catch-all" Respond node that emits:

```json
{
  "ok": false,
  "status": "error",
  "message": "Internal workflow error",
  "trace_id": "wf_<execution_id>"
}
```

The Next.js layer maps any non-200 or `ok:false` response to a toast notification on the UI.

---

## 6. Security checklist

- `x-webhook-secret` validated on every workflow's first IF node.
- Webhook URLs are **never** exposed to the browser.
- Supabase credentials live inside n8n credentials store, not in the frontend.
- AI Agent system prompt blocks confidential-info leakage (wholesale costs, master reset codes, anything tagged `INTERNAL ONLY`).
- AI Agent system prompt blocks prompt-injection and off-topic requests.
