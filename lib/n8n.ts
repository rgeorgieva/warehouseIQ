import "server-only";

const BASE = process.env.N8N_BASE_URL?.replace(/\/+$/, "") ?? "";
const SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

if (!BASE) {
  console.warn(
    "[warehouseIQ] N8N_BASE_URL is not set. Frontend will return mock errors until configured.",
  );
}

export type N8nErrorPayload = {
  ok: false;
  status: "transport_error" | "config_error" | "upstream_error";
  message: string;
};

export async function n8nFetch<T>(path: string, body: unknown): Promise<T | N8nErrorPayload> {
  if (!BASE) {
    return {
      ok: false,
      status: "config_error",
      message: "N8N_BASE_URL is not configured.",
    } satisfies N8nErrorPayload;
  }
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SECRET ? { "x-webhook-secret": SECRET } : {}),
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        status: "upstream_error",
        message: `n8n ${path} -> HTTP ${res.status}: ${text.slice(0, 300)}`,
      } satisfies N8nErrorPayload;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return {
        ok: false,
        status: "upstream_error",
        message: `n8n ${path} returned non-JSON body: ${text.slice(0, 200)}`,
      } satisfies N8nErrorPayload;
    }
  } catch (err) {
    return {
      ok: false,
      status: "transport_error",
      message: err instanceof Error ? err.message : "Unknown transport error",
    } satisfies N8nErrorPayload;
  }
}
