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

const isNewArch =
  typeof (global as unknown as { __turboModuleProxy?: unknown }).__turboModuleProxy === "object";
if (
  Platform.OS === "android" &&
  !isNewArch &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const animateAndDispatch = useCallback((action: OrdersAction) => {
    LayoutAnimation.configureNext(LAYOUT_ANIM_CONFIG);
    dispatch(action);
  }, []);

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

  // "silent" não mostra erro na UI — usado na reconexão do WS pra não
  // perturbar o usuário se o refetch falhar
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
          err instanceof Error ? err.message : "Falha ao carregar pedidos";
        if (mode !== "silent") {
          dispatch({ type: "FETCH_ERROR", payload: message });
        }
      }
    },
    []
  );

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
