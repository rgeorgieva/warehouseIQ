import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { n8nFetch } from "@/lib/n8n";
import { mockChat, isMock } from "@/lib/mock";
import type { ChatResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  session_id: z.string().min(1),
  message: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({
      ok: false,
      status: "validation_error",
      message: "Invalid JSON body",
    });
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
    return NextResponse.json(
      { ...mockChat(parsed.data.message), session_id: parsed.data.session_id },
      { headers: { "x-mock": "1" } },
    );
  }
  const data = await n8nFetch<ChatResponse>("/chat", parsed.data);
  return NextResponse.json(data);
}
