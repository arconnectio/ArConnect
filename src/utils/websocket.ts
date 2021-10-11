import * as websocket from "websocket";

let socketQueueId: number = 0;
let socketQueue: any = {};

const makeCallbackId = (id: number): string => "i_" + id;

const W3CWebSocket = websocket.w3cwebsocket;
const client = new W3CWebSocket("ws://localhost:5555/arc");

client.onerror = () => {
  // TODO: Show error in toast
  console.log("Connection error");
};

client.onmessage = (e) => {
  if (typeof e.data === "string") {
    const data = JSON.parse(e.data);

    if (data.hasOwnProperty("id")) {
      const callbackId = makeCallbackId(data["id"]);
      const callback = socketQueue[callbackId];
      if (callback) {
        callback(data["payload"]);
        delete socketQueue[callbackId];
      }
      return;
    }
  }
};

export function sendNativeMessage(
  action: string,
  message?: string,
  callback?: (response: any) => void
): void {
  if (client) {
    ++socketQueueId;
    if (callback) {
      socketQueue[makeCallbackId(socketQueueId)] = callback;
    }
    client.send(`{"id": ${socketQueueId}, "action": "${action}"}`);
  }
}
