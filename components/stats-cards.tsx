"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Boxes, AlertTriangle, DollarSign, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/client";
import { formatCurrency } from "@/lib/utils";

type Stats = {
  totalItems: number;
  totalUnits: number;
  lowStockCount: number;
  totalValue: number;
};

export function StatsCards() {
  const [stats, setStats] = React.useState<Stats | null>(null);

  const refresh = React.useCallback(async () => {
    const r = await api.list();
    if (r.ok) {
      setStats({
        totalItems: r.items.length,
        totalUnits: r.items.reduce((s, i) => s + i.stock_level, 0),
        lowStockCount: r.items.filter((i) => i.below_reorder).length,
        totalValue: r.items.reduce((s, i) => s + i.stock_level * Number(i.price), 0),
      });
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const onRefresh = () => refresh();
    window.addEventListener("inventory:refresh", onRefresh);
    return () => window.removeEventListener("inventory:refresh", onRefresh);
  }, [refresh]);

  const cards = [
    {
      label: "Items tracked",
      value: stats?.totalItems,
      hint: stats ? `${stats.totalUnits.toLocaleString()} units total` : null,
      icon: Boxes,
      tint: "text-foreground",
    },
    {
      label: "Inventory value",
      value: stats ? formatCurrency(stats.totalValue) : null,
      hint: "At list price",
      icon: DollarSign,
      tint: "text-foreground",
    },
    {
      label: "Below reorder",
      value: stats?.lowStockCount,
      hint:
        stats?.lowStockCount === 0
          ? "All healthy ✓"
          : stats
            ? `${stats.lowStockCount} item${stats.lowStockCount === 1 ? "" : "s"} need attention`
            : null,
      icon: AlertTriangle,
      tint:
        stats && stats.lowStockCount > 0
          ? "text-[color:var(--warning)]"
          : "text-[color:var(--success)]",
    },
    {
      label: "Stock pressure",
      value: stats ? `${Math.round(((stats?.lowStockCount ?? 0) / Math.max(stats.totalItems, 1)) * 100)}%` : null,
      hint: "Share of SKUs below reorder",
      icon: TrendingDown,
      tint: "text-foreground",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card>
            <CardContent className="flex flex-col gap-1 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
                <c.icon className={`h-4 w-4 ${c.tint}`} />
              </div>
              <div className={`mt-2 text-2xl font-semibold tabular-nums ${c.tint}`}>
                {c.value ?? <Skeleton className="h-7 w-20" />}
              </div>
              <div className="text-xs text-muted-foreground">
                {c.hint ?? <Skeleton className="h-3 w-32" />}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
