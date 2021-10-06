import { WebSocket } from "ws";

const ws = new WebSocket("ws://localhost:5555/arc");

ws.on("open", () => {
  ws.send(`{"request": "hello"}`);
});

ws.on("message", (msg) => {
  console.log("Received: %s", msg);
});

export function sendNativeMessage(action: string, message?: string): void {
  if (ws) ws.send(`{"request": "${action}"}`);
}
