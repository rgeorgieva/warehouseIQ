import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { n8nFetch } from "@/lib/n8n";
import { mockOperation, isMock } from "@/lib/mock";
import type { OperationResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  item_id: z.number().int().positive(),
  action: z.enum(["inbound", "outbound"]),
  quantity: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, status: "validation_error", message: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      ok: false,
      status: "validation_error",
      message: parsed.error.errors.map((e) => e.message).join("; "),
    });
  }
  if (isMock()) {
    return NextResponse.json(mockOperation(parsed.data), { headers: { "x-mock": "1" } });
  }
  const data = await n8nFetch<OperationResponse>("/inventory/operation", parsed.data);
  return NextResponse.json(data);
}
