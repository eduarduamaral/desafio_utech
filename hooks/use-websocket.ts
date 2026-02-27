import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { ConnectionStatus, WebSocketEvent } from "@/types/order";
import { WS_URL } from "@/services/config";
import { parseWebSocketEvent } from "@/services/validation";

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

interface UseWebSocketOptions {
  onEvent: (event: WebSocketEvent) => void;
  /**
   * Chamado quando a conexão é restabelecida após uma queda.
   * Usado pelo useOrders para fazer um refetch silencioso e recuperar
   * eventos que possam ter sido perdidos durante a desconexão.
   * Não é chamado na conexão inicial — apenas em reconexões.
   */
  onReconnect?: () => void;
}

export function useWebSocket({ onEvent, onReconnect }: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  // useRef para a instância do WebSocket: não causa re-render ao mudar,
  // pois o WebSocket é um recurso imperativo, não um dado de apresentação.
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // O delay atual de reconexão é mantido em ref para sobreviver entre
  // renders sem criar dependências em useCallback.
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);

  // Refs para os callbacks evitam que a troca de referência de função
  // (a cada render do componente pai) cause recriação da conexão WS.
  // O callback sempre executado será o mais recente sem precisar de deps.
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);

  // Indica se o componente ainda está montado. Impede que callbacks
  // assíncronos tentem atualizar estado após o unmount (memory leak).
  const isMountedRef = useRef(true);

  // Distingue a primeira conexão de reconexões subsequentes para decidir
  // se deve chamar onReconnect (e disparar o refetch HTTP).
  const wasConnectedRef = useRef(false);

  // Sincroniza as refs com os valores mais recentes a cada render,
  // sem precisar adicionar os callbacks como deps dos useCallback abaixo.
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
      // Nulos nos handlers antes de fechar para evitar que onclose dispare
      // assincronamente numa instância já descartada e acione uma reconexão
      // não desejada (ex: durante o unmount).
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

    // Garante que não haverá duas conexões abertas simultaneamente.
    disconnect();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      setStatus("connected");
      // Reset do delay: a próxima eventual queda começa novamente em 1s.
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

      // Só notifica reconexão após a primeira vez — na conexão inicial
      // o useEffect já disparou loadOrders, não há necessidade de refetch.
      if (wasConnectedRef.current) {
        onReconnectRef.current?.();
      }
      wasConnectedRef.current = true;
    };

    ws.onmessage = (event) => {
      // Valida o payload antes de despachar para o estado. Dados malformados
      // são descartados silenciosamente — parseWebSocketEvent retorna null.
      const parsed = parseWebSocketEvent(event.data);
      if (parsed) {
        onEventRef.current(parsed);
      }
    };

    // onerror sempre é seguido de onclose no WebSocket da Web API,
    // então a lógica de reconexão fica centralizada apenas em onclose.
    ws.onerror = () => {};

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      wsRef.current = null;
      setStatus("reconnecting");

      // Exponential backoff: cada falha dobra o tempo de espera até o
      // máximo de 30s. Evita sobrecarregar o servidor com reconexões
      // imediatas caso ele esteja com problema ("thundering herd").
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

    // Quando o app volta do background, o sistema operacional pode ter
    // encerrado a conexão WebSocket sem disparar onclose. O listener de
    // AppState detecta essa situação e força uma reconexão.
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            // Reset do backoff ao voltar do background: o usuário está de
            // volta e espera dados atualizados imediatamente.
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
