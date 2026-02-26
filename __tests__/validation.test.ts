import { parseWebSocketEvent } from "../services/validation";

describe("parseWebSocketEvent", () => {
  describe("NEW_ORDER", () => {
    it("parses a valid NEW_ORDER event", () => {
      const raw = JSON.stringify({
        type: "NEW_ORDER",
        payload: {
          id: "3",
          customer: "Alice",
          status: "pending",
          amount: 42.0,
        },
      });

      const result = parseWebSocketEvent(raw);

      expect(result).toEqual({
        type: "NEW_ORDER",
        payload: {
          id: "3",
          customer: "Alice",
          status: "pending",
          amount: 42.0,
        },
      });
    });

    it("rejects NEW_ORDER with missing customer", () => {
      const raw = JSON.stringify({
        type: "NEW_ORDER",
        payload: { id: "3", status: "pending", amount: 42.0 },
      });

      expect(parseWebSocketEvent(raw)).toBeNull();
    });

    it("rejects NEW_ORDER with invalid amount type", () => {
      const raw = JSON.stringify({
        type: "NEW_ORDER",
        payload: { id: "3", customer: "Alice", status: "pending", amount: "42" },
      });

      expect(parseWebSocketEvent(raw)).toBeNull();
    });

    it("rejects NEW_ORDER with invalid status", () => {
      const raw = JSON.stringify({
        type: "NEW_ORDER",
        payload: { id: "3", customer: "Alice", status: "unknown", amount: 42 },
      });

      expect(parseWebSocketEvent(raw)).toBeNull();
    });
  });

  describe("ORDER_UPDATED", () => {
    it("parses a valid ORDER_UPDATED event", () => {
      const raw = JSON.stringify({
        type: "ORDER_UPDATED",
        payload: {
          id: "1",
          customer: "John Doe",
          status: "completed",
          amount: 120.5,
        },
      });

      const result = parseWebSocketEvent(raw);

      expect(result).toEqual({
        type: "ORDER_UPDATED",
        payload: {
          id: "1",
          customer: "John Doe",
          status: "completed",
          amount: 120.5,
        },
      });
    });

    it("rejects ORDER_UPDATED with null payload", () => {
      const raw = JSON.stringify({
        type: "ORDER_UPDATED",
        payload: null,
      });

      expect(parseWebSocketEvent(raw)).toBeNull();
    });
  });

  describe("ORDER_CANCELLED", () => {
    it("parses a valid ORDER_CANCELLED event", () => {
      const raw = JSON.stringify({
        type: "ORDER_CANCELLED",
        payload: { id: "2" },
      });

      const result = parseWebSocketEvent(raw);

      expect(result).toEqual({
        type: "ORDER_CANCELLED",
        payload: { id: "2" },
      });
    });

    it("rejects ORDER_CANCELLED with numeric id", () => {
      const raw = JSON.stringify({
        type: "ORDER_CANCELLED",
        payload: { id: 2 },
      });

      expect(parseWebSocketEvent(raw)).toBeNull();
    });

    it("rejects ORDER_CANCELLED with missing id", () => {
      const raw = JSON.stringify({
        type: "ORDER_CANCELLED",
        payload: {},
      });

      expect(parseWebSocketEvent(raw)).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("returns null for invalid JSON", () => {
      expect(parseWebSocketEvent("not json")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseWebSocketEvent("")).toBeNull();
    });

    it("returns null for unknown event type", () => {
      const raw = JSON.stringify({
        type: "UNKNOWN_EVENT",
        payload: { id: "1" },
      });

      expect(parseWebSocketEvent(raw)).toBeNull();
    });

    it("returns null for missing type field", () => {
      const raw = JSON.stringify({
        payload: { id: "1" },
      });

      expect(parseWebSocketEvent(raw)).toBeNull();
    });

    it("returns null for array input", () => {
      expect(parseWebSocketEvent("[]")).toBeNull();
    });

    it("returns null for primitive input", () => {
      expect(parseWebSocketEvent("42")).toBeNull();
      expect(parseWebSocketEvent("true")).toBeNull();
      expect(parseWebSocketEvent('"hello"')).toBeNull();
    });
  });
});
