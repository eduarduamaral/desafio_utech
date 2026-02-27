import { Order, WebSocketEvent } from "@/types/order";

/**
 * Type guard que verifica se um valor desconhecido é um objeto não-nulo.
 * Necessário porque typeof null === "object" em JavaScript — sem essa
 * checagem extra, null passaria pela verificação de tipo de objeto.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Tenta extrair um Order válido de um valor desconhecido.
 *
 * Valida tanto os tipos primitivos quanto os valores do domínio:
 * verificar typeof status === "string" não é suficiente — um status
 * "desconhecido" passaria a checagem de tipo mas quebraria o mapeamento
 * de estilos no OrderCard. A validação de domínio garante consistência
 * entre runtime e TypeScript.
 */
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

/**
 * Faz o parse e a validação de uma mensagem raw do WebSocket.
 *
 * Retorna null (em vez de lançar exceção) porque um evento malformado
 * não é um erro fatal — o app deve ignorar silenciosamente e continuar
 * funcionando. Essa abordagem defensiva protege o estado da aplicação
 * contra dados inesperados vindos do servidor.
 *
 * O TypeScript garante tipos apenas em tempo de compilação; esta função
 * é a barreira de segurança em runtime antes que os dados entrem no reducer.
 */
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
        // Para cancelamento, só o id é necessário — o restante dos dados
        // já existe no estado local e não precisa ser retransmitido.
        if (!isObject(data.payload) || typeof data.payload.id !== "string")
          return null;
        return { type: "ORDER_CANCELLED", payload: { id: data.payload.id } };
      }

      // Eventos desconhecidos são ignorados — garante compatibilidade
      // caso o servidor envie novos tipos de evento no futuro.
      default:
        return null;
    }
  } catch {
    return null;
  }
}
