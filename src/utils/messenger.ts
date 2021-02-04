export interface MessageFormat {
  type: MessageType;
  ext: "weavemask";
  res?: boolean;
  message?: string;
  sender: MessageSender;
  [key: string]: any;
}

type MessageSender = "popup" | "background" | "api";
type MessageType = "connect" | "connect_result" | "connect_result";

export function sendMessage(
  message: MessageFormat,
  responseCallback?: (res: MessageFormat) => void,
  doResponse?: (response?: any) => void,
  runtime: boolean = true
) {
  if (doResponse) return doResponse(message);
  if (runtime) chrome.runtime.sendMessage(message, responseCallback);
  else window.postMessage(message, window.location.origin);
}

export function validateMessage(
  message: any,
  { sender, type }: { sender?: MessageSender; type?: MessageType }
) {
  if (!message) return false;
  if (
    !message.ext ||
    message.ext !== "weavemask" ||
    !message.sender ||
    !message.type
  )
    return false;
  if (sender && message.sender !== sender) return false;
  if (type && message.type !== type) return false;
  return true;
}
