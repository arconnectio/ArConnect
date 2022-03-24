import { isJsxOpeningElement } from "typescript";
import * as websocket from "websocket";

let socketQueueId: number = 0;
let socketQueue: any = {};

const makeCallbackId = (id: number): string => "i_" + id;

const W3CWebSocket = websocket.w3cwebsocket;
const client = new W3CWebSocket("ws://localhost:5555/arc");

const handleError = () => {
  const callbackId = makeCallbackId(0);
  const callback = socketQueue[callbackId];
  if (callback) {
    callback();
  }
};

client.onerror = () => {
  handleError();
};

client.onclose = () => {
  handleError();
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

export function isSocketOpen() {
  return client.readyState === client.OPEN;
}

export function setNativeMessageErrorHandler(callback: () => void) {
  if (callback) {
    socketQueue[makeCallbackId(0)] = callback;
  }
}

export function sendNativeMessage(
  action: string,
  message?: any,
  callback?: (response: any) => void
): void {
  try {
    if (!client) {
      handleError();
    }

    // Implementation details - https://stackoverflow.com/a/24145135
    ++socketQueueId;
    if (callback) {
      socketQueue[makeCallbackId(socketQueueId)] = callback;
    }

    const data = {
      id: socketQueueId,
      action: action,
      payload: message
    };
    client.send(JSON.stringify(data));
  } catch (e) {
    handleError();
  }
}
