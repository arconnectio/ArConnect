import * as websocket from "websocket";

const ERROR_MSG_ID: number = 0; // reserve for error callback
const INITIAL_MSG_ID: number = 1;

const makeCallbackId = (id: number): string => "i_" + id;

// TODO: This instance must live from browser start to the end.
let globalClientConn: websocket.w3cwebsocket;

export class NativeAppClient {
  private static instance: NativeAppClient;

  private msgQueue: any = {};
  private msgId: number = INITIAL_MSG_ID;

  public static getInstance(): NativeAppClient | undefined {
    if (
      !NativeAppClient.instance ||
      globalClientConn.readyState !== globalClientConn.OPEN
    ) {
      try {
        NativeAppClient.instance = new NativeAppClient();
      } catch {
        return undefined;
      }
    }

    return NativeAppClient.instance;
  }

  public initialize() {
    globalClientConn = new websocket.w3cwebsocket("ws://localhost:5555/arc");

    globalClientConn.onopen = () => {};

    globalClientConn.onerror = () => {
      this.handleError();
    };

    globalClientConn.onclose = () => {
      this.handleError();
    };

    globalClientConn.onmessage = (e) => {
      if (typeof e.data === "string") {
        const data = JSON.parse(e.data);

        if (data.hasOwnProperty("id")) {
          const callbackId = makeCallbackId(data["id"]);
          const callback = this.msgQueue[callbackId];
          if (callback && data.hasOwnProperty("payload")) {
            callback(data["payload"]);
            delete this.msgQueue[callbackId];
          }
        }
      }
    };
  }

  public isConnected(): boolean {
    return globalClientConn.readyState === globalClientConn.OPEN;
  }

  public send(
    action: string,
    message?: any,
    callback?: (response: any) => void
  ): void {
    try {
      if (!this.isConnected()) {
        this.handleError();
      }

      // Implementation details - https://stackoverflow.com/a/24145135
      ++this.msgId;
      if (callback) {
        this.msgQueue[makeCallbackId(this.msgId)] = callback;
      }

      const data = {
        id: this.msgId,
        action: action,
        payload: message
      };
      globalClientConn.send(JSON.stringify(data));
    } catch (e) {
      this.handleError();
    }
  }

  public setErrorHandler(callback: () => void) {
    this.msgQueue[makeCallbackId(ERROR_MSG_ID)] = callback;
  }

  private constructor() {
    this.initialize();
  }

  private handleError(): void {
    const callbackId = makeCallbackId(0);
    const callback = this.msgQueue[callbackId];
    if (callback) {
      callback();
    }
  }
}
