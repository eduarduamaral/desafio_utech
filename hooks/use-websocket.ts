import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { ConnectionStatus, WebSocketEvent } from "@/types/order";
import { WS_URL } from "@/services/config";
import { parseWebSocketEvent } from "@/services/validation";

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

interface UseWebSocketOptions {
  onEvent: (event: WebSocketEvent) => void;
  onReconnect?: () => void;
}

export function useWebSocket({ onEvent, onReconnect }: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  const isMountedRef = useRef(true);
  const wasConnectedRef = useRef(false);

  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current!);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    if (wsRef.current) {
      // Anula handlers antes de fechar pra evitar que onclose
      // dispare numa instância já descartada
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [clearReconnectTimeout]);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    disconnect();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      setStatus("connected");
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

      // Só faz refetch na reconexão, não na primeira conexão
      if (wasConnectedRef.current) {
        onReconnectRef.current?.();
      }
      wasConnectedRef.current = true;
    };

    ws.onmessage = (event) => {
      const parsed = parseWebSocketEvent(event.data);
      if (parsed) {
        onEventRef.current(parsed);
      }
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      wsRef.current = null;
      setStatus("reconnecting");

      // Exponential backoff: 1s → 2s → 4s → ... → 30s máx
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) connect();
      }, delay);
    };
  }, [disconnect]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    // Reconecta ao voltar do background (o OS pode ter matado o socket)
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
            connect();
          }
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      disconnect();
    };
  }, [connect, disconnect]);

  return { status };
}
