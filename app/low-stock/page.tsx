import { LowStockList } from "@/components/low-stock-list";

export default function LowStockPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Low Stock</h1>
        <p className="text-sm text-muted-foreground">
          Inventory items where <code>stock_level</code> &lt; <code>reorder_point</code>.
        </p>
      </div>
      <LowStockList />
    </div>
  );
}
