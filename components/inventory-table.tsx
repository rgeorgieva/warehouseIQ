"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/client";
import { formatCurrency, cn } from "@/lib/utils";
import type { InventoryItem } from "@/lib/types";

export function InventoryTable({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = React.useState<InventoryItem[] | null>(null);
  const [filter, setFilter] = React.useState("");

  const refresh = React.useCallback(async () => {
    const r = await api.list();
    if (r.ok) setItems(r.items);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    const onRefresh = () => refresh();
    window.addEventListener("inventory:refresh", onRefresh);
    return () => window.removeEventListener("inventory:refresh", onRefresh);
  }, [refresh]);

  const filtered =
    items?.filter((i) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        i.item_name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }) ?? null;

  if (items === null) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items or category…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-12 border-b bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <div className="col-span-5">Item</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Stock</div>
          <div className="col-span-1 text-right">Reorder</div>
          <div className="col-span-2 text-right">Price</div>
        </div>
        <AnimatePresence initial={false}>
          {filtered?.map((i) => (
            <motion.div
              key={i.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "grid grid-cols-12 items-center px-4 py-2.5 text-sm border-b last:border-b-0 transition-colors",
                i.below_reorder && "bg-[color:var(--warning)]/5",
              )}
            >
              <div className="col-span-5 flex items-center gap-2">
                <span className="truncate font-medium">{i.item_name}</span>
                {i.below_reorder && (
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    low
                  </Badge>
                )}
              </div>
              <div className="col-span-2 text-muted-foreground">{i.category}</div>
              <div className="col-span-2 text-right tabular-nums">
                {i.stock_level}
              </div>
              <div className="col-span-1 text-right tabular-nums text-muted-foreground">
                {i.reorder_point}
              </div>
              <div className="col-span-2 text-right tabular-nums">
                {formatCurrency(i.price)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered?.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No items match “{filter}”.
          </div>
        )}
      </div>
    </div>
  );
}
