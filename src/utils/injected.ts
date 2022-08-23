import { MessageFormat, validateMessage, MessageType } from "./messenger";

let messageId = 0;

export const callAPI = (message: any) =>
  new Promise<void | any>((resolve, reject) => {
    // give every message a unique autoincrementing id
    const id = messageId;

    message.id = id;
    messageId += 1;

    window.postMessage(
      { ...message, ext: "arconnect", sender: "api" },
      window.location.origin
    );

    window.addEventListener("message", callback);

    // @ts-ignore
    function callback(e: MessageEvent<any>) {
      if (!validateMessage(e.data, undefined, `${message.type}_result`)) return;

      // only resolve when the result matching our message.id is deleivered
      if (id !== e.data?.id) return;

      window.removeEventListener("message", callback);
      if (e.data?.res === false) reject(e.data?.message);
      else resolve(e.data);
    }
  });
