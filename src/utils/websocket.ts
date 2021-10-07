import * as websocket from "websocket";

const W3CWebSocket = websocket.w3cwebsocket;

const client = new W3CWebSocket("ws://localhost:5555/arc");

client.onerror = () => {
  console.log("Connection Error");
};

client.onopen = () => {
  console.log("WebSocket Client Connected");
};

client.onmessage = (e) => {
  if (typeof e.data === "string") {
    console.log("Received: '" + e.data + "'");
  }
};

export function sendNativeMessage(action: string, message?: string): void {
  if (client) client.send(`{"request": "${action}"}`);
}
