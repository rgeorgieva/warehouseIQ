import { NextResponse } from "next/server";
import { n8nFetch } from "@/lib/n8n";
import { mockList, isMock } from "@/lib/mock";
import type { InventoryListResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST() {
  if (isMock()) {
    return NextResponse.json(mockList(), { headers: { "x-mock": "1" } });
  }
  const data = await n8nFetch<InventoryListResponse>("/inventory/list", {});
  return NextResponse.json(data);
}

export const GET = POST;
