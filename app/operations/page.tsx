"use client";

import * as React from "react";
import { OperationForm } from "@/components/operation-form";
import { InventoryTable } from "@/components/inventory-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/client";
import type { InventoryItem } from "@/lib/types";

export default function OperationsPage() {
  const [items, setItems] = React.useState<InventoryItem[] | null>(null);

  const refresh = React.useCallback(async () => {
    const r = await api.list();
    if (r.ok) setItems(r.items);
  }, []);

  React.useEffect(() => {
    refresh();
    const onRefresh = () => refresh();
    window.addEventListener("inventory:refresh", onRefresh);
    return () => window.removeEventListener("inventory:refresh", onRefresh);
  }, [refresh]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Receive shipments or ship items out. Every operation is logged to <code>order_logs</code>.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <OperationForm action="inbound" items={items} />
        <OperationForm action="outbound" items={items} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current stock</CardTitle>
          <CardDescription>Updates automatically after each operation.</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTable compact />
        </CardContent>
      </Card>
    </div>
  );
}
