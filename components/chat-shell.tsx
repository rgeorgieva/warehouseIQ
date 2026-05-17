"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Send, RotateCcw, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/client";
import { getOrCreateSessionId, resetSessionId } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { nanoid } from "nanoid";

const SUGGESTIONS = [
  "What's running low?",
  "When was the last outbound for G-Pro Graphics Card?",
  "How do I calibrate the Industrial Grade Sensor?",
];

export function ChatShell() {
  const [sessionId, setSessionId] = React.useState<string>("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  React.useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || !sessionId) return;
    const userMsg: ChatMessage = {
      id: nanoid(8),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);
    try {
      const r = await api.chat({ session_id: sessionId, message: text });
      if (r.ok) {
        setMessages((m) => [
          ...m,
          {
            id: nanoid(8),
            role: "assistant",
            content: r.reply,
            timestamp: Date.now(),
          },
        ]);
      } else {
        toast.error("Agent error", { description: r.message });
        setMessages((m) => [
          ...m,
          {
            id: nanoid(8),
            role: "assistant",
            content: `(error) ${r.message}`,
            timestamp: Date.now(),
          },
        ]);
      }
    } finally {
      setPending(false);
    }
  };

  const onReset = () => {
    setMessages([]);
    setSessionId(resetSessionId());
    toast.info("Started a fresh chat session.");
  };

  return (
    <Card className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Warehouse Operations Specialist</div>
            <div className="text-[11px] text-muted-foreground">
              Session: <span className="font-mono">{sessionId.slice(0, 16)}…</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div ref={viewportRef} className="space-y-4 p-5">
          {messages.length === 0 && !pending && (
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="font-medium">Ask the agent anything about your warehouse.</div>
                <div className="text-xs text-muted-foreground">
                  Live inventory, order history, and product manuals — backed by Supabase MCP + RAG.
                </div>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </AnimatePresence>
          {pending && <TypingBubble />}
        </div>
      </ScrollArea>

      <form
        className="flex items-center gap-2 border-t bg-card/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message the agent…"
          disabled={pending}
          className="flex-1"
        />
        <Button type="submit" disabled={pending || !input.trim()} size="icon">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground",
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
