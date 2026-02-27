import { useCallback, useReducer } from "react";
import { LayoutAnimation, Platform, UIManager } from "react-native";
import { ConnectionStatus, Order, WebSocketEvent } from "@/types/order";
import { useWebSocket } from "./use-websocket";
import { fetchOrders } from "@/services/api";
import {
  ordersReducer,
  initialState,
  OrdersAction,
} from "./orders-reducer";

// O LayoutAnimation no Android requer habilitação explícita via UIManager.
// No iOS e Web isso não é necessário.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Configuração de animação reutilizável para transições de layout da lista.
// easeInEaseOut com opacity dá uma sensação suave de entrada/saída dos cards.
const LAYOUT_ANIM_CONFIG = LayoutAnimation.create(
  300,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity
);

interface UseOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  loadOrders: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useOrders(): UseOrdersReturn {
  const [state, dispatch] = useReducer(ordersReducer, initialState);

  /**
   * Wrapper que agenda a animação de layout antes de despachar uma action
   * que modifica a lista. O LayoutAnimation precisa ser configurado
   * *antes* da mudança de estado — na próxima renderização o React Native
   * já aplica a transição automaticamente em todos os filhos afetados.
   */
  const animateAndDispatch = useCallback((action: OrdersAction) => {
    LayoutAnimation.configureNext(LAYOUT_ANIM_CONFIG);
    dispatch(action);
  }, []);

  /**
   * Traduz eventos do WebSocket para actions do reducer.
   * useCallback com deps estáveis evita que uma nova referência de função
   * seja passada ao useWebSocket a cada render, o que causaria
   * recriação desnecessária da conexão.
   */
  const handleWebSocketEvent = useCallback(
    (event: WebSocketEvent) => {
      switch (event.type) {
        case "NEW_ORDER":
          animateAndDispatch({ type: "ADD_ORDER", payload: event.payload });
          break;
        case "ORDER_UPDATED":
          animateAndDispatch({ type: "UPDATE_ORDER", payload: event.payload });
          break;
        case "ORDER_CANCELLED":
          animateAndDispatch({
            type: "CANCEL_ORDER",
            payload: event.payload.id,
          });
          break;
      }
    },
    [animateAndDispatch]
  );

  /**
   * Função central de busca de pedidos, compartilhada pelos três modos:
   *
   * - "load"    → exibe spinner, erro vai para a tela de erro
   * - "refresh" → exibe indicador de pull-to-refresh, erro vai para banner
   * - "silent"  → sem feedback visual, falha é descartada
   *
   * O modo "silent" é usado pelo onReconnect: queremos atualizar os dados
   * após reconectar mas sem perturbar a UI caso o fetch falhe — o usuário
   * ainda vê os dados anteriores, que continuam válidos.
   */
  const doFetch = useCallback(
    async (mode: "load" | "refresh" | "silent") => {
      if (mode === "load") dispatch({ type: "FETCH_START" });
      else if (mode === "refresh") dispatch({ type: "REFRESH_START" });

      try {
        const orders = await fetchOrders();
        LayoutAnimation.configureNext(LAYOUT_ANIM_CONFIG);
        dispatch({ type: "FETCH_SUCCESS", payload: orders });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load orders";
        if (mode !== "silent") {
          dispatch({ type: "FETCH_ERROR", payload: message });
        }
      }
    },
    []
  );

  /**
   * Disparado pelo useWebSocket sempre que a conexão é restabelecida
   * após uma queda. O refetch em modo silencioso garante que pedidos
   * que chegaram enquanto o app estava desconectado sejam sincronizados.
   */
  const handleReconnect = useCallback(() => {
    doFetch("silent");
  }, [doFetch]);

  const { status: connectionStatus } = useWebSocket({
    onEvent: handleWebSocketEvent,
    onReconnect: handleReconnect,
  });

  const loadOrders = useCallback(() => doFetch("load"), [doFetch]);
  const onRefresh = useCallback(() => doFetch("refresh"), [doFetch]);

  return {
    orders: state.orders,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    connectionStatus,
    loadOrders,
    onRefresh,
  };
}
