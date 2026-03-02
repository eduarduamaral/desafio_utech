export interface Order {
  id: string;
  customer: string;
  status: "pending" | "completed" | "cancelled";
  amount: number;
}

export type WebSocketEventType =
  | "NEW_ORDER"
  | "ORDER_UPDATED"
  | "ORDER_CANCELLED";

export interface NewOrderEvent {
  type: "NEW_ORDER";
  payload: Order;
}

export interface OrderUpdatedEvent {
  type: "ORDER_UPDATED";
  payload: Order;
}

export interface OrderCancelledEvent {
  type: "ORDER_CANCELLED";
  payload: { id: string };
}

export type WebSocketEvent =
  | NewOrderEvent
  | OrderUpdatedEvent
  | OrderCancelledEvent;

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
