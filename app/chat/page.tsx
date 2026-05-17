import { ChatShell } from "@/components/chat-shell";

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Talk to the Warehouse Operations Specialist. It can read live data via Supabase MCP and
          consult internal product manuals via RAG.
        </p>
      </div>
      <ChatShell />
    </div>
  );
}
