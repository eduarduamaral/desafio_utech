const http = require("http");
const { WebSocketServer } = require("ws");

const ORDERS = [
  { id: "1", customer: "John Doe", status: "pending", amount: 120.5 },
  { id: "2", customer: "Jane Smith", status: "completed", amount: 89.9 },
  { id: "3", customer: "Carlos Silva", status: "pending", amount: 250.0 },
  { id: "4", customer: "Maria Oliveira", status: "completed", amount: 45.75 },
  { id: "5", customer: "Bob Wilson", status: "pending", amount: 310.2 },
];

let nextId = ORDERS.length + 1;

const CUSTOMER_NAMES = [
  "Alice Johnson",
  "Roberto Lima",
  "Emma Davis",
  "Lucas Santos",
  "Sophie Brown",
  "Pedro Costa",
  "Mia Garcia",
  "André Ferreira",
];

function randomCustomer() {
  return CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
}

function randomAmount() {
  return Math.round((Math.random() * 500 + 10) * 100) / 100;
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/orders") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(ORDERS));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("close", () => console.log("Client disconnected"));
});

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
}

function simulateEvents() {
  const actions = ["NEW_ORDER", "ORDER_UPDATED", "ORDER_CANCELLED"];
  const action = actions[Math.floor(Math.random() * actions.length)];

  const activeOrders = ORDERS.filter((o) => o.status !== "cancelled");

  switch (action) {
    case "NEW_ORDER": {
      const order = {
        id: String(nextId++),
        customer: randomCustomer(),
        status: "pending",
        amount: randomAmount(),
      };
      ORDERS.push(order);
      broadcast({ type: "NEW_ORDER", payload: order });
      console.log(`NEW_ORDER: ${order.customer} - $${order.amount}`);
      break;
    }

    case "ORDER_UPDATED": {
      const pending = activeOrders.filter((o) => o.status === "pending");
      if (pending.length === 0) break;
      const target = pending[Math.floor(Math.random() * pending.length)];
      target.status = "completed";
      broadcast({ type: "ORDER_UPDATED", payload: { ...target } });
      console.log(`ORDER_UPDATED: ${target.id} -> completed`);
      break;
    }

    case "ORDER_CANCELLED": {
      if (activeOrders.length <= 2) break;
      const target =
        activeOrders[Math.floor(Math.random() * activeOrders.length)];
      target.status = "cancelled";
      broadcast({ type: "ORDER_CANCELLED", payload: { id: target.id } });
      console.log(`ORDER_CANCELLED: ${target.id}`);
      break;
    }
  }
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`HTTP server running at http://localhost:${PORT}`);
  console.log(`WebSocket server running at ws://localhost:${PORT}`);
  console.log("Simulating events every 3-8 seconds...\n");

  function scheduleNext() {
    const delay = 3000 + Math.random() * 5000;
    setTimeout(() => {
      simulateEvents();
      scheduleNext();
    }, delay);
  }
  scheduleNext();
});
