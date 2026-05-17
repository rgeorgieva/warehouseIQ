"use client";

import type {
  InventoryListResponse,
  HealthCheckResponse,
  OperationRequest,
  OperationResponse,
  ChatRequest,
  ChatResponse,
} from "./types";

async function post<T>(url: string, body: unknown = {}): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return res.json();
}

export const api = {
  list: () => post<InventoryListResponse>("/api/inventory/list"),
  health: () => post<HealthCheckResponse>("/api/inventory/health"),
  operation: (req: OperationRequest) => post<OperationResponse>("/api/inventory/op", req),
  chat: (req: ChatRequest) => post<ChatResponse>("/api/chat", req),
};
