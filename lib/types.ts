export type InventoryItem = {
  id: number;
  item_name: string;
  category: string;
  stock_level: number;
  reorder_point: number;
  price: number;
  supplier_email: string | null;
  below_reorder?: boolean;
};

export type LowStockItem = InventoryItem & {
  shortage: number;
};

export type InventoryListResponse =
  | { ok: true; items: InventoryItem[] }
  | { ok: false; status: string; message: string };

export type HealthCheckResponse =
  | { ok: true; low_stock_count: number; items: LowStockItem[] }
  | { ok: false; status: string; message: string };

export type OperationRequest = {
  item_id: number;
  action: "inbound" | "outbound";
  quantity: number;
};

export type OperationResponse =
  | {
      ok: true;
      status: "success" | "below_reorder";
      item: InventoryItem;
      log_id: number;
      message?: string;
    }
  | {
      ok: false;
      status: "insufficient";
      message: string;
      item: Partial<InventoryItem>;
      requested: number;
      available: number;
    }
  | {
      ok: false;
      status: "validation_error" | "error" | "unauthorized";
      message: string;
    };

export type ChatRequest = {
  session_id: string;
  message: string;
};

export type ChatResponse =
  | {
      ok: true;
      session_id: string;
      reply: string;
      tools_used?: string[];
    }
  | { ok: false; status: string; message: string };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};
