import { Order } from "@/types/order";

export interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

/**
 * União discriminada de todas as actions possíveis.
 * Manter os tipos de action aqui (e não inline no switch) permite que o
 * TypeScript infira o tipo correto do payload em cada case automaticamente,
 * sem necessidade de type assertions.
 */
export type OrdersAction =
  | { type: "FETCH_START" }
  | { type: "REFRESH_START" }
  | { type: "FETCH_SUCCESS"; payload: Order[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER"; payload: Order }
  | { type: "CANCEL_ORDER"; payload: string };

export const initialState: OrdersState = {
  orders: [],
  // Começa como true para que a tela exiba o spinner imediatamente,
  // antes mesmo de o useEffect disparar o primeiro fetch.
  isLoading: true,
  isRefreshing: false,
  error: null,
};

/**
 * Reducer puro que centraliza todas as transições de estado dos pedidos.
 *
 * Sendo uma função pura (sem side effects, sem dependências externas),
 * é trivialmente testável: dado o mesmo estado + action, sempre retorna
 * o mesmo resultado. O React usa comparação de referência para detectar
 * mudanças, por isso cada case retorna um novo objeto em vez de mutar o estado.
 *
 * Extraído do hook propositalmente para ser testado de forma isolada,
 * sem precisar mockar React Native, WebSocket ou qualquer outra dependência.
 */
export function ordersReducer(
  state: OrdersState,
  action: OrdersAction,
): OrdersState {
  switch (action.type) {
    case "FETCH_START":
      // Limpa o erro anterior ao tentar novamente para não confundir o usuário
      // com uma mensagem de erro antiga enquanto a nova requisição está em curso.
      return { ...state, isLoading: true, error: null };

    case "REFRESH_START":
      // isRefreshing é separado de isLoading para que a FlatList possa
      // exibir o indicador nativo de pull-to-refresh sem esconder a lista.
      return { ...state, isRefreshing: true, error: null };

    case "FETCH_SUCCESS":
      // Substitui completamente a lista (não faz merge) para garantir
      // consistência com o servidor após um refresh ou reconexão.
      return {
        orders: action.payload,
        isLoading: false,
        isRefreshing: false,
        error: null,
      };

    case "FETCH_ERROR":
      // Preserva os pedidos existentes: se um refresh falhar, o usuário
      // continua vendo os dados anteriores em vez de uma tela vazia.
      return {
        ...state,
        isLoading: false,
        isRefreshing: false,
        error: action.payload,
      };

    case "ADD_ORDER":
      // Idempotência: se o mesmo pedido chegar duas vezes (HTTP e WS em
      // paralelo, por exemplo), a segunda chegada é descartada sem modificar
      // o estado — retornando a mesma referência para evitar re-render.
      if (state.orders.some((o) => o.id === action.payload.id)) return state;
      // Prepend: novos pedidos aparecem no topo da lista.
      return { ...state, orders: [action.payload, ...state.orders] };

    case "UPDATE_ORDER":
      // Substitui o pedido inteiro pelo payload recebido do servidor,
      // garantindo que todos os campos (não só o status) fiquem atualizados.
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o,
        ),
      };

    case "CANCEL_ORDER":
      // Para cancelamentos o servidor só envia o id, então atualizamos
      // apenas o status localmente, preservando os demais campos.
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload ? { ...o, status: "cancelled" as const } : o,
        ),
      };

    default:
      return state;
  }
}
