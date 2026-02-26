import { Order } from "@/types/order";

export interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

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
  isLoading: true,
  isRefreshing: false,
  error: null,
};

export function ordersReducer(
  state: OrdersState,
  action: OrdersAction
): OrdersState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "REFRESH_START":
      return { ...state, isRefreshing: true, error: null };

    case "FETCH_SUCCESS":
      return {
        orders: action.payload,
        isLoading: false,
        isRefreshing: false,
        error: null,
      };

    case "FETCH_ERROR":
      return {
        ...state,
        isLoading: false,
        isRefreshing: false,
        error: action.payload,
      };

    case "ADD_ORDER":
      if (state.orders.some((o) => o.id === action.payload.id)) return state;
      return { ...state, orders: [action.payload, ...state.orders] };

    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        ),
      };

    case "CANCEL_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload ? { ...o, status: "cancelled" as const } : o
        ),
      };

    default:
      return state;
  }
}
