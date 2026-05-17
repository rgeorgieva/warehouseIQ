import type {
  InventoryItem,
  LowStockItem,
  OperationRequest,
  OperationResponse,
} from "./types";

// Static mock data used when N8N_BASE_URL is unconfigured.
// Mirrors db/seed_inventory.sql so the UI is testable offline.
const items: InventoryItem[] = [
  { id: 1, item_name: "X-1000 Power Processor",  category: "Electronics", stock_level: 12, reorder_point: 15, price: 299.99,  supplier_email: "support@techparts.com" },
  { id: 2, item_name: "G-Pro Graphics Card",     category: "Electronics", stock_level:  5, reorder_point:  8, price: 599.00,  supplier_email: "sales@visiongear.com" },
  { id: 3, item_name: "High-Speed Cooling Fan",  category: "Components",  stock_level:  3, reorder_point: 10, price:  15.25,  supplier_email: "info@coolingsys.net" },
  { id: 4, item_name: "Industrial Grade Sensor", category: "Components",  stock_level: 20, reorder_point: 12, price:  89.50,  supplier_email: "orders@oemcorp.com" },
  { id: 5, item_name: "Secure Cloud Hub",        category: "Networking",  stock_level:  7, reorder_point:  5, price: 1249.00, supplier_email: "b2b@securecloud.io" },
];

let logSeq = 100;

export function mockList() {
  return {
    ok: true as const,
    items: items.map((i) => ({ ...i, below_reorder: i.stock_level < i.reorder_point })),
  };
}

export function mockHealthCheck() {
  const low: LowStockItem[] = items
    .filter((i) => i.stock_level < i.reorder_point)
    .map((i) => ({ ...i, shortage: i.reorder_point - i.stock_level }))
    .sort((a, b) => b.shortage - a.shortage);
  return { ok: true as const, low_stock_count: low.length, items: low };
}

export function mockOperation(req: OperationRequest): OperationResponse {
  const item = items.find((i) => i.id === req.item_id);
  if (!item) {
    return { ok: false, status: "validation_error", message: `item_id ${req.item_id} not found` };
  }
  if (!Number.isInteger(req.quantity) || req.quantity <= 0) {
    return { ok: false, status: "validation_error", message: "quantity must be a positive integer" };
  }
  if (req.action === "inbound") {
    item.stock_level += req.quantity;
    return {
      ok: true,
      status: "success",
      item: { ...item, below_reorder: item.stock_level < item.reorder_point },
      log_id: ++logSeq,
    };
  }
  // outbound
  if (req.quantity > item.stock_level) {
    return {
      ok: false,
      status: "insufficient",
      message: `Requested ${req.quantity} but only ${item.stock_level} available.`,
      item: { id: item.id, item_name: item.item_name, stock_level: item.stock_level },
      requested: req.quantity,
      available: item.stock_level,
    };
  }
  item.stock_level -= req.quantity;
  const log_id = ++logSeq;
  if (item.stock_level < item.reorder_point) {
    return {
      ok: true,
      status: "below_reorder",
      message: `Outbound completed. ${item.item_name} is now below reorder point (${item.stock_level} < ${item.reorder_point}).`,
      item: { ...item, below_reorder: true },
      log_id,
    };
  }
  return {
    ok: true,
    status: "success",
    item: { ...item, below_reorder: false },
    log_id,
  };
}

export function mockChat(message: string) {
  const lower = message.toLowerCase();
  let reply: string;
  if (/joke|weather|ignore|jailbreak|admin|wholesale|reset code/i.test(lower)) {
    reply = "I can only help with warehouse and inventory questions.";
  } else if (/low|reorder|running low|out of stock/.test(lower)) {
    const low = items.filter((i) => i.stock_level < i.reorder_point);
    reply = low.length
      ? `Items below reorder point:\n${low.map((i) => `• ${i.item_name} (stock ${i.stock_level}, reorder at ${i.reorder_point})`).join("\n")}`
      : "All items are at or above their reorder points.";
  } else if (/calibrat/.test(lower)) {
    reply = "**Industrial Grade Sensor — calibration**:\n1. Power on with 24V DC.\n2. Press the 'Zero' button for 5 seconds.\n3. Adjust the trim-pot until output reads 4.00 mA.";
  } else if (/last outbound|last inbound|last operation/.test(lower)) {
    reply = "(mock) The last outbound was for G-Pro Graphics Card, 3 units, two hours ago.";
  } else {
    reply = "(mock reply) Configure N8N_BASE_URL in .env.local to talk to the real AI agent.";
  }
  return { ok: true as const, session_id: "mock", reply, tools_used: ["mock"] };
}

export const isMock = () => !process.env.N8N_BASE_URL;
