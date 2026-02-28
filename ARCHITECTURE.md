# Arquitetura do App

## Índice de Arquivos

| Camada | Arquivo |
|---|---|
| Backend mock | [`server/index.js`](./server/index.js) |
| Tipos | [`types/order.ts`](./types/order.ts) |
| Config | [`services/config.ts`](./services/config.ts) |
| HTTP | [`services/api.ts`](./services/api.ts) |
| Validação WS | [`services/validation.ts`](./services/validation.ts) |
| Reducer | [`hooks/orders-reducer.ts`](./hooks/orders-reducer.ts) |
| Hook WebSocket | [`hooks/use-websocket.ts`](./hooks/use-websocket.ts) |
| Hook Orders | [`hooks/use-orders.ts`](./hooks/use-orders.ts) |
| Tela principal | [`app/(tabs)/index.tsx`](./app/(tabs)/index.tsx) |
| Layout tabs | [`app/(tabs)/_layout.tsx`](./app/(tabs)/_layout.tsx) |
| Layout root | [`app/_layout.tsx`](./app/_layout.tsx) |
| OrderCard | [`components/order-card.tsx`](./components/order-card.tsx) |
| ConnectionStatus | [`components/connection-status.tsx`](./components/connection-status.tsx) |
| EmptyState | [`components/empty-state.tsx`](./components/empty-state.tsx) |
| Testes reducer | [`__tests__/orders-reducer.test.ts`](./__tests__/orders-reducer.test.ts) |
| Testes validação | [`__tests__/validation.test.ts`](./__tests__/validation.test.ts) |

---

## 1. Fluxo de Dados Geral

```mermaid
flowchart TD
    subgraph Backend["🖥️ Backend (Mock Server — porta 3001)"]
        HTTP["GET /orders\nHTTP REST"]
        WS["WebSocket\nws://localhost:3001"]
        SIM["Simulador de Eventos\n(a cada 5–12s)"]
        SIM -->|NEW_ORDER\nORDER_UPDATED\nORDER_CANCELLED| WS
    end

    subgraph Services["📦 services/"]
        API["api.ts\nfetchOrders()"]
        VAL["validation.ts\nparseWebSocketEvent()"]
        CFG["config.ts\nAPI_BASE_URL / WS_URL"]
    end

    subgraph Hooks["🪝 hooks/"]
        UWS["useWebSocket\n• conecta ao WS\n• exponential backoff\n• AppState listener"]
        UO["useOrders\n• despacha actions\n• chama doFetch\n• aciona animações"]
        RED["ordersReducer\n(função pura)"]
    end

    subgraph UI["📱 UI"]
        SCR["OrdersScreen\n(index.tsx)"]
        BADGE["ConnectionStatusBadge"]
        CARD["OrderCard (memo)"]
        EMPTY["EmptyState"]
    end

    HTTP -->|resposta JSON| API
    WS -->|mensagem raw string| VAL
    CFG --> API
    CFG --> UWS

    API -->|Order[]| UO
    VAL -->|WebSocketEvent| UWS
    UWS -->|onEvent| UO
    UWS -->|onReconnect → doFetch silent| UO
    UWS -->|ConnectionStatus| UO

    UO -->|dispatch| RED
    RED -->|novo estado| UO

    UO -->|orders, isLoading\nisRefreshing, error\nconnectionStatus| SCR
    SCR --> BADGE
    SCR --> CARD
    SCR --> EMPTY

    click SIM "server/index.js" "server/index.js"
    click HTTP "server/index.js" "server/index.js"
    click WS "server/index.js" "server/index.js"
    click API "services/api.ts" "services/api.ts"
    click VAL "services/validation.ts" "services/validation.ts"
    click CFG "services/config.ts" "services/config.ts"
    click UWS "hooks/use-websocket.ts" "hooks/use-websocket.ts"
    click UO "hooks/use-orders.ts" "hooks/use-orders.ts"
    click RED "hooks/orders-reducer.ts" "hooks/orders-reducer.ts"
    click SCR "app/(tabs)/index.tsx" "app/(tabs)/index.tsx"
    click BADGE "components/connection-status.tsx" "components/connection-status.tsx"
    click CARD "components/order-card.tsx" "components/order-card.tsx"
    click EMPTY "components/empty-state.tsx" "components/empty-state.tsx"
```

---

## 2. Ciclo de Vida da Conexão WebSocket

```mermaid
stateDiagram-v2
    [*] --> Disconnected : mount

    Disconnected --> Connecting : connect()
    Connecting --> Connected : onopen
    Connected --> Reconnecting : onclose / onerror
    Reconnecting --> Connecting : setTimeout(exponential backoff)

    Connected --> Disconnected : unmount / disconnect()
    Reconnecting --> Disconnected : unmount / isMounted = false

    Connected --> Connected : onmessage\n→ parseWebSocketEvent\n→ onEvent → dispatch

    note right of Connected
        Ao reconectar:
        wasConnectedRef = true
        → onReconnect()
        → doFetch("silent")
    end note

    note right of Reconnecting
        Delay: 1s → 2s → 4s → ... → 30s
        Reset ao reconectar com sucesso
        Reset ao voltar do background (AppState)
    end note
```

> Implementação: [`hooks/use-websocket.ts`](./hooks/use-websocket.ts)

---

## 3. Gerenciamento de Estado — Reducer

```mermaid
flowchart LR
    subgraph Actions
        A1["FETCH_START"]
        A2["REFRESH_START"]
        A3["FETCH_SUCCESS\npayload: Order[]"]
        A4["FETCH_ERROR\npayload: string"]
        A5["ADD_ORDER\npayload: Order"]
        A6["UPDATE_ORDER\npayload: Order"]
        A7["CANCEL_ORDER\npayload: id"]
    end

    subgraph State["OrdersState"]
        S1["orders: Order[]"]
        S2["isLoading: boolean"]
        S3["isRefreshing: boolean"]
        S4["error: string | null"]
    end

    A1 -->|isLoading=true\nerror=null| State
    A2 -->|isRefreshing=true\nerror=null| State
    A3 -->|orders=payload\nisLoading=false\nisRefreshing=false\nerror=null| State
    A4 -->|error=payload\nisLoading=false\nisRefreshing=false| State
    A5 -->|"prepend se id novo\n(idempotente)"| State
    A6 -->|"map: substitui por id"| State
    A7 -->|"map: status='cancelled'"| State

    click A1 "hooks/orders-reducer.ts" "hooks/orders-reducer.ts"
    click A2 "hooks/orders-reducer.ts" "hooks/orders-reducer.ts"
    click A3 "hooks/orders-reducer.ts" "hooks/orders-reducer.ts"
    click A4 "hooks/orders-reducer.ts" "hooks/orders-reducer.ts"
    click A5 "hooks/orders-reducer.ts" "hooks/orders-reducer.ts"
    click A6 "hooks/orders-reducer.ts" "hooks/orders-reducer.ts"
    click A7 "hooks/orders-reducer.ts" "hooks/orders-reducer.ts"
```

> Implementação: [`hooks/orders-reducer.ts`](./hooks/orders-reducer.ts) · Testes: [`__tests__/orders-reducer.test.ts`](./__tests__/orders-reducer.test.ts)

---

## 4. Árvore de Componentes

```mermaid
flowchart TD
    ROOT["RootLayout\napp/_layout.tsx\nThemeProvider + Stack"]
    TABS["TabLayout\napp/tabs/_layout.tsx"]
    SCR["OrdersScreen\napp/tabs/index.tsx"]

    subgraph Renderização Condicional
        LOAD["ActivityIndicator\nisLoading = true"]
        ERR["Tela de Erro + Retry\nerror + sem dados"]
        LIST["FlatList\nestado normal"]
    end

    subgraph Componentes da Lista
        HEADER["ListHeaderComponent\nN orders"]
        CARD["OrderCard memo\ncustomer · status badge · id · amount"]
        BANNER["Error Banner\nerro com dados existentes"]
        EMPTY["EmptyState\nlista vazia"]
    end

    subgraph Header da Tela
        TITLE["Orders"]
        BADGE["ConnectionStatusBadge\n🟢 Connected\n🟡 Reconnecting pulsa\n🔴 Disconnected"]
    end

    ROOT --> TABS --> SCR
    SCR --> LOAD
    SCR --> ERR
    SCR --> LIST
    SCR --> TITLE
    SCR --> BADGE
    SCR --> BANNER
    LIST --> HEADER
    LIST --> CARD
    LIST --> EMPTY

    click ROOT "app/_layout.tsx" "app/_layout.tsx"
    click TABS "app/(tabs)/_layout.tsx" "app/(tabs)/_layout.tsx"
    click SCR "app/(tabs)/index.tsx" "app/(tabs)/index.tsx"
    click CARD "components/order-card.tsx" "components/order-card.tsx"
    click BADGE "components/connection-status.tsx" "components/connection-status.tsx"
    click EMPTY "components/empty-state.tsx" "components/empty-state.tsx"
```

---

## 5. Validação de Eventos WebSocket

```mermaid
flowchart TD
    RAW["raw string\nevent.data"]
    PARSE["JSON.parse()"]
    CHKOBJ["isObject?\ntype = string?"]
    TYPE{"type"}

    RAW --> PARSE
    PARSE -->|"catch: inválido"| NULL["return null ❌"]
    PARSE --> CHKOBJ
    CHKOBJ -->|não| NULL
    CHKOBJ --> TYPE

    TYPE -->|NEW_ORDER| VO["parseOrder payload\nvalida: id, customer,\nstatus, amount + domínio"]
    TYPE -->|ORDER_UPDATED| VO
    TYPE -->|ORDER_CANCELLED| VC["isObject payload?\nid = string?"]
    TYPE -->|desconhecido| NULL

    VO -->|inválido| NULL
    VO -->|válido| EVT["return WebSocketEvent ✅"]
    VC -->|inválido| NULL
    VC -->|válido| EVT

    click RAW "hooks/use-websocket.ts" "hooks/use-websocket.ts"
    click PARSE "services/validation.ts" "services/validation.ts"
    click CHKOBJ "services/validation.ts" "services/validation.ts"
    click VO "services/validation.ts" "services/validation.ts"
    click VC "services/validation.ts" "services/validation.ts"
    click EVT "types/order.ts" "types/order.ts"
```

> Implementação: [`services/validation.ts`](./services/validation.ts) · Testes: [`__tests__/validation.test.ts`](./__tests__/validation.test.ts)
