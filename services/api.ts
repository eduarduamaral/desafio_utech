import { Order } from "@/types/order";
import { API_BASE_URL } from "./config";

/**
 * Busca a lista inicial de pedidos via HTTP.
 *
 * Lança um Error em caso de resposta não-2xx para que o chamador possa
 * tratar o erro de forma explícita (dispatch FETCH_ERROR no reducer).
 * Não retorna um objeto de resultado com { data, error } porque o
 * tratamento de erro via throw + try/catch no hook é mais idiomático
 * com async/await e mantém a assinatura simples.
 */
export async function fetchOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/orders`);

  if (!response.ok) {
    throw new Error(`Falha ao buscar pedidos: ${response.status}`);
  }

  return response.json();
}
