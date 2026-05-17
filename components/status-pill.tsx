"use client";

import * as React from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "checking" | "connected" | "mock" | "error";

export function StatusPill() {
  const [status, setStatus] = React.useState<Status>("checking");
  const [detail, setDetail] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/inventory/list", { method: "POST", cache: "no-store" })
      .then(async (r) => {
        const isMock = r.headers.get("x-mock") === "1";
        const json = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (isMock) {
          setStatus("mock");
          setDetail("Using offline mock data — set N8N_BASE_URL to go live.");
        } else if (json?.ok) {
          setStatus("connected");
          setDetail("Connected to n8n");
        } else {
          setStatus("error");
          setDetail(json?.message ?? "n8n returned an error");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setDetail(err?.message ?? "Network error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const color =
    status === "connected"
      ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
      : status === "mock"
        ? "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"
        : status === "error"
          ? "bg-[color:var(--danger)]/15 text-[color:var(--danger)]"
          : "bg-muted text-muted-foreground";
  const label =
    status === "connected"
      ? "n8n live"
      : status === "mock"
        ? "mock mode"
        : status === "error"
          ? "offline"
          : "checking…";

  return (
    <div
      title={detail}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        color,
      )}
    >
      <Activity className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}
