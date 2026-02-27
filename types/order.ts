/**
 * Representa um pedido retornado pela API HTTP e manipulado via WebSocket.
 * O status é um union type restrito para que o TypeScript rejeite em
 * tempo de compilação qualquer valor fora do domínio esperado.
 */
export interface Order {
  id: string;
  customer: string;
  status: "pending" | "completed" | "cancelled";
  amount: number;
}

/**
 * Tipo auxiliar que lista os nomes de eventos possíveis do WebSocket.
 * Útil para checagens pontuais sem precisar importar as interfaces completas.
 */
export type WebSocketEventType =
  | "NEW_ORDER"
  | "ORDER_UPDATED"
  | "ORDER_CANCELLED";

/**
 * Cada evento WebSocket tem sua própria interface com payload tipado.
 * Isso permite que o TypeScript faça narrowing automático no switch/case:
 * ao checar event.type === "ORDER_CANCELLED", o compilador sabe que
 * event.payload só tem { id }, sem customer, amount, etc.
 */
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
  // O evento de cancelamento só precisa do id — o restante já está no estado local.
  payload: { id: string };
}

/**
 * União discriminada dos três eventos possíveis.
 * O campo `type` é o discriminante, permitindo narrowing seguro em qualquer
 * switch sem necessidade de type assertions (as).
 */
export type WebSocketEvent =
  | NewOrderEvent
  | OrderUpdatedEvent
  | OrderCancelledEvent;

/**
 * Estados possíveis da conexão WebSocket expostos para a UI.
 * "reconnecting" é distinto de "disconnected" para comunicar ao usuário
 * que o app está tentando se recuperar automaticamente.
 */
export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
