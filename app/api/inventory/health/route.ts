import { NextResponse } from "next/server";
import { n8nFetch } from "@/lib/n8n";
import { mockHealthCheck, isMock } from "@/lib/mock";
import type { HealthCheckResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST() {
  if (isMock()) {
    return NextResponse.json(mockHealthCheck(), { headers: { "x-mock": "1" } });
  }
  const data = await n8nFetch<HealthCheckResponse>("/inventory/health-check", {});
  return NextResponse.json(data);
}

export const GET = POST;
