import { ordersReducer, initialState, OrdersState } from "../hooks/orders-reducer";
import { Order } from "../types/order";

const mockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: "1",
  customer: "John Doe",
  status: "pending",
  amount: 120.5,
  ...overrides,
});

describe("ordersReducer", () => {
  describe("FETCH_START", () => {
    it("sets isLoading to true and clears error", () => {
      const state: OrdersState = {
        ...initialState,
        isLoading: false,
        error: "previous error",
      };

      const result = ordersReducer(state, { type: "FETCH_START" });

      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    it("preserves existing orders", () => {
      const orders = [mockOrder()];
      const state: OrdersState = { ...initialState, orders, isLoading: false };

      const result = ordersReducer(state, { type: "FETCH_START" });

      expect(result.orders).toBe(orders);
    });
  });

  describe("REFRESH_START", () => {
    it("sets isRefreshing to true and clears error", () => {
      const state: OrdersState = { ...initialState, error: "old error" };

      const result = ordersReducer(state, { type: "REFRESH_START" });

      expect(result.isRefreshing).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe("FETCH_SUCCESS", () => {
    it("replaces orders and resets loading flags", () => {
      const state: OrdersState = {
        ...initialState,
        isLoading: true,
        isRefreshing: true,
      };
      const orders = [mockOrder(), mockOrder({ id: "2", customer: "Jane" })];

      const result = ordersReducer(state, {
        type: "FETCH_SUCCESS",
        payload: orders,
      });

      expect(result.orders).toEqual(orders);
      expect(result.isLoading).toBe(false);
      expect(result.isRefreshing).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  describe("FETCH_ERROR", () => {
    it("sets error and resets loading flags", () => {
      const state: OrdersState = {
        ...initialState,
        isLoading: true,
        isRefreshing: true,
      };

      const result = ordersReducer(state, {
        type: "FETCH_ERROR",
        payload: "Network error",
      });

      expect(result.error).toBe("Network error");
      expect(result.isLoading).toBe(false);
      expect(result.isRefreshing).toBe(false);
    });

    it("preserves existing orders on error", () => {
      const orders = [mockOrder()];
      const state: OrdersState = { ...initialState, orders, isLoading: true };

      const result = ordersReducer(state, {
        type: "FETCH_ERROR",
        payload: "Failed",
      });

      expect(result.orders).toBe(orders);
    });
  });

  describe("ADD_ORDER", () => {
    it("prepends the new order to the list", () => {
      const existing = mockOrder({ id: "1" });
      const newOrder = mockOrder({ id: "2", customer: "Alice" });
      const state: OrdersState = {
        ...initialState,
        orders: [existing],
      };

      const result = ordersReducer(state, {
        type: "ADD_ORDER",
        payload: newOrder,
      });

      expect(result.orders).toHaveLength(2);
      expect(result.orders[0]).toEqual(newOrder);
      expect(result.orders[1]).toEqual(existing);
    });

    it("ignores duplicate order ids", () => {
      const existing = mockOrder({ id: "1" });
      const state: OrdersState = {
        ...initialState,
        orders: [existing],
      };

      const result = ordersReducer(state, {
        type: "ADD_ORDER",
        payload: mockOrder({ id: "1", customer: "Different" }),
      });

      expect(result).toBe(state);
      expect(result.orders).toHaveLength(1);
    });
  });

  describe("UPDATE_ORDER", () => {
    it("updates the matching order by id", () => {
      const order1 = mockOrder({ id: "1", status: "pending" });
      const order2 = mockOrder({ id: "2", customer: "Jane" });
      const state: OrdersState = {
        ...initialState,
        orders: [order1, order2],
      };

      const updated = { ...order1, status: "completed" as const };
      const result = ordersReducer(state, {
        type: "UPDATE_ORDER",
        payload: updated,
      });

      expect(result.orders[0].status).toBe("completed");
      expect(result.orders[1]).toBe(order2);
    });

    it("does not modify other orders", () => {
      const order1 = mockOrder({ id: "1" });
      const order2 = mockOrder({ id: "2", customer: "Jane" });
      const state: OrdersState = {
        ...initialState,
        orders: [order1, order2],
      };

      const result = ordersReducer(state, {
        type: "UPDATE_ORDER",
        payload: { ...order1, status: "completed" },
      });

      expect(result.orders[1]).toBe(order2);
    });
  });

  describe("CANCEL_ORDER", () => {
    it("sets the matching order status to cancelled", () => {
      const order = mockOrder({ id: "1", status: "pending" });
      const state: OrdersState = {
        ...initialState,
        orders: [order],
      };

      const result = ordersReducer(state, {
        type: "CANCEL_ORDER",
        payload: "1",
      });

      expect(result.orders[0].status).toBe("cancelled");
      expect(result.orders[0].customer).toBe(order.customer);
      expect(result.orders[0].amount).toBe(order.amount);
    });

    it("does not modify non-matching orders", () => {
      const order1 = mockOrder({ id: "1", status: "pending" });
      const order2 = mockOrder({ id: "2", status: "completed" });
      const state: OrdersState = {
        ...initialState,
        orders: [order1, order2],
      };

      const result = ordersReducer(state, {
        type: "CANCEL_ORDER",
        payload: "1",
      });

      expect(result.orders[0].status).toBe("cancelled");
      expect(result.orders[1]).toBe(order2);
    });
  });

  describe("unknown action", () => {
    it("returns the current state", () => {
      const state: OrdersState = { ...initialState };

      // @ts-expect-error testing unknown action type
      const result = ordersReducer(state, { type: "UNKNOWN" });

      expect(result).toBe(state);
    });
  });
});
