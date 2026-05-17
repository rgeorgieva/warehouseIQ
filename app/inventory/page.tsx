import { InventoryTable } from "@/components/inventory-table";

export default function InventoryPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Full inventory list. Items below their reorder point are highlighted.
        </p>
      </div>
      <InventoryTable />
    </div>
  );
}
