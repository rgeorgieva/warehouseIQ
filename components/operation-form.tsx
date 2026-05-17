"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/client";
import type { InventoryItem } from "@/lib/types";

type Props = {
  action: "inbound" | "outbound";
  items: InventoryItem[] | null;
};

const COPY = {
  inbound: {
    title: "Inbound — Add stock",
    description: "Increase stock for the selected item. Logs to order history.",
    button: "Receive shipment",
    icon: ArrowDownToLine,
    accent: "text-[color:var(--success)]",
    border: "border-[color:var(--success)]/30",
  },
  outbound: {
    title: "Outbound — Ship stock",
    description: "Remove stock for the selected item. Logs to order history.",
    button: "Ship items",
    icon: ArrowUpFromLine,
    accent: "text-[color:var(--danger)]",
    border: "border-[color:var(--danger)]/30",
  },
} as const;

export function OperationForm({ action, items }: Props) {
  const c = COPY[action];
  const Icon = c.icon;
  const [itemId, setItemId] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<string>("1");
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) {
      toast.warning("Please pick an item.");
      return;
    }
    const q = Number(quantity);
    if (!Number.isInteger(q) || q <= 0) {
      toast.warning("Quantity must be a positive integer.");
      return;
    }
    setPending(true);
    try {
      const r = await api.operation({ item_id: Number(itemId), action, quantity: q });
      if (r.ok && r.status === "success") {
        toast.success(
          `${action === "inbound" ? "Received" : "Shipped"} ${q} × ${r.item.item_name}`,
          { description: `New stock level: ${r.item.stock_level}` },
        );
      } else if (r.ok && r.status === "below_reorder") {
        toast.warning(`Below reorder: ${r.item.item_name}`, {
          description:
            r.message ??
            `Stock is now ${r.item.stock_level} (reorder at ${r.item.reorder_point}).`,
          duration: 8000,
        });
      } else if (!r.ok && r.status === "insufficient") {
        toast.error(`Not enough stock`, {
          description: r.message,
          duration: 8000,
        });
      } else {
        toast.error(r.status, { description: r.message });
      }
      window.dispatchEvent(new CustomEvent("inventory:refresh"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className={`border-2 ${c.border}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${c.accent}`} />
          <CardTitle>{c.title}</CardTitle>
        </div>
        <CardDescription>{c.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`item-${action}`}>Item</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger id={`item-${action}`}>
                <SelectValue placeholder={items ? "Select an item…" : "Loading…"} />
              </SelectTrigger>
              <SelectContent>
                {items?.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.item_name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      (stock {i.stock_level})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`qty-${action}`}>Quantity</Label>
            <Input
              id={`qty-${action}`}
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            variant={action === "inbound" ? "success" : "default"}
            disabled={pending}
            className="w-full"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Working…
              </>
            ) : (
              <>
                <Icon className="h-4 w-4" /> {c.button}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
