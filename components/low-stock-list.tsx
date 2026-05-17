"use client";

import * as React from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AlertTriangle, Mail, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/client";
import { formatCurrency } from "@/lib/utils";
import type { LowStockItem } from "@/lib/types";

export function LowStockList({ limit }: { limit?: number }) {
  const [items, setItems] = React.useState<LowStockItem[] | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const run = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api.health();
      if (r.ok) {
        setItems(r.items);
        toast.success(
          r.low_stock_count === 0
            ? "All stock levels are healthy."
            : `${r.low_stock_count} item${r.low_stock_count === 1 ? "" : "s"} below reorder point`,
        );
      } else {
        toast.error("Health check failed", { description: r.message });
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    run();
    const onRefresh = () => run();
    window.addEventListener("inventory:refresh", onRefresh);
    return () => window.removeEventListener("inventory:refresh", onRefresh);
  }, [run]);

  const display = limit && items ? items.slice(0, limit) : items;

  return (
    <div className="space-y-4">
      {limit === undefined && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Runs the health-check workflow against your live inventory.
          </p>
          <Button onClick={run} variant="outline" disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Run health check
          </Button>
        </div>
      )}
      {display === null ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : display.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-[color:var(--success)]" />
            <p className="text-sm font-medium">All items are at or above their reorder points.</p>
            <p className="text-xs text-muted-foreground">Nothing to worry about right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {display.map((i, idx) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="border-[color:var(--warning)]/30">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold leading-tight">{i.item_name}</div>
                      <div className="text-xs text-muted-foreground">{i.category}</div>
                    </div>
                    <Badge variant="warning" className="gap-1 shrink-0">
                      <AlertTriangle className="h-3 w-3" />
                      −{i.shortage}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Stock</div>
                      <div className="font-medium tabular-nums">{i.stock_level}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Reorder</div>
                      <div className="font-medium tabular-nums">{i.reorder_point}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Price</div>
                      <div className="font-medium tabular-nums">{formatCurrency(i.price)}</div>
                    </div>
                  </div>
                  {i.supplier_email && (
                    <a
                      href={`mailto:${i.supplier_email}?subject=${encodeURIComponent(`Reorder request: ${i.item_name}`)}&body=${encodeURIComponent(
                        `Hello,\n\nWe'd like to place a reorder for ${i.item_name}. Our current stock is ${i.stock_level} (reorder point ${i.reorder_point}).\n\nThanks,\nGlobalLogistics Corp.`,
                      )}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      Email {i.supplier_email}
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
