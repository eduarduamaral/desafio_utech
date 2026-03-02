# Desafio UTech — Monitoramento de Pedidos

App React Native (Expo) para monitoramento de pedidos em tempo real via HTTP + WebSocket.

## Como rodar

```bash
npm install
```

Em dois terminais:

```bash
# Terminal 1 — servidor mock (porta 3001)
npm run server

# Terminal 2 — app
npm start
```

Para rodar os testes:

```bash
npm test
```

## Estrutura

```
types/order.ts          → tipos do pedido e eventos WS
services/config.ts      → URLs de HTTP e WebSocket
services/api.ts         → fetch da lista de pedidos
services/validation.ts  → validação runtime dos eventos WS
hooks/orders-reducer.ts → reducer puro (state dos pedidos)
hooks/use-websocket.ts  → conexão WS com reconexão automática
hooks/use-orders.ts     → hook principal que une HTTP + WS
components/             → OrderCard, ConnectionStatusBadge, EmptyState
app/(tabs)/index.tsx    → tela de pedidos
server/index.js         → mock server (HTTP + WS)
__tests__/              → testes do reducer e da validação
```

## Decisões técnicas

- **useReducer** em vez de múltiplos useState pra manter o estado dos pedidos consistente (loading, error, orders mudam juntos)
- **Reducer extraído** do hook pra poder testar isoladamente sem dependências de React Native
- **Validação runtime** dos eventos WS porque TypeScript só garante tipos em compilação — dados vindos do servidor podem estar malformados
- **Exponential backoff** na reconexão WS (1s → 2s → 4s → ... → 30s) pra não sobrecarregar o servidor
- **Refetch silencioso** ao reconectar o WS pra sincronizar pedidos que possam ter sido perdidos
- **React.memo** no OrderCard pra evitar re-render de todos os cards quando só um muda
- **LayoutAnimation** pra animar entrada/saída de pedidos na lista
