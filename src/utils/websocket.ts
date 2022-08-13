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

  /**
   * @brief Singleton that restricts the instantiation of the class.
   * @returns "single" instance of the class.
   */
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

  /**
   * @brief Establishes connection between current extension and desktop app.
   */
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

  /**
   * @brief Checks whether connection is established.
   * @returns true if extension connected to the desktop app, false otherwise.
   */
  public isConnected(): boolean {
    return globalClientConn.readyState === globalClientConn.OPEN;
  }

  /**
   * @brief Sends a message to the desktop app.
   * @param action Action name.
   * @param message JSON data that relates to action.
   * @param callback Callback that handles response from the desktop app.
   */
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

  /**
   * @brief Sets error handler that is executed when the connection is aborted.
   * @param callback Callback that handles error case.
   */
  public setErrorHandler(callback: () => void) {
    const callbackId = makeCallbackId(ERROR_MSG_ID);
    if (!this.msgQueue[callbackId]) {
      this.msgQueue[callbackId] = callback;
    }
  }

  private constructor() {
    this.initialize();
  }

  private handleError(): void {
    const callbackId = makeCallbackId(ERROR_MSG_ID);
    const callback = this.msgQueue[callbackId];
    if (callback) {
      callback();
      delete this.msgQueue[callbackId];
    }
  }
}
