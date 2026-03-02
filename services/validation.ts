import { Order, WebSocketEvent } from "@/types/order";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseOrder(value: unknown): Order | null {
  if (!isObject(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.customer !== "string" ||
    typeof value.status !== "string" ||
    typeof value.amount !== "number"
  )
    return null;

  const status = value.status;
  if (status !== "pending" && status !== "completed" && status !== "cancelled")
    return null;

  return {
    id: value.id,
    customer: value.customer,
    status,
    amount: value.amount,
  };
}

/** Valida e parseia uma mensagem raw do WebSocket. Retorna null se inválida. */
export function parseWebSocketEvent(raw: string): WebSocketEvent | null {
  try {
    const data = JSON.parse(raw);
    if (!isObject(data) || typeof data.type !== "string") return null;

    switch (data.type) {
      case "NEW_ORDER": {
        const order = parseOrder(data.payload);
        if (!order) return null;
        return { type: "NEW_ORDER", payload: order };
      }

      case "ORDER_UPDATED": {
        const order = parseOrder(data.payload);
        if (!order) return null;
        return { type: "ORDER_UPDATED", payload: order };
      }

      case "ORDER_CANCELLED": {
        if (!isObject(data.payload) || typeof data.payload.id !== "string")
          return null;
        return { type: "ORDER_CANCELLED", payload: { id: data.payload.id } };
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}
