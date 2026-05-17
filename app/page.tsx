import { StatsCards } from "@/components/stats-cards";
import { InventoryTable } from "@/components/inventory-table";
import { LowStockList } from "@/components/low-stock-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live state of the warehouse, sourced from your n8n orchestration layer.
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inventory snapshot</CardTitle>
            <CardDescription>The latest stock levels for every tracked item.</CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryTable compact />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>At risk</CardTitle>
            <CardDescription>Items below their reorder point.</CardDescription>
          </CardHeader>
          <CardContent>
            <LowStockList limit={5} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
