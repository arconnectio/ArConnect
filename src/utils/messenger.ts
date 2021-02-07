export interface MessageFormat {
  type: MessageType;
  ext: "weavemask";
  res?: boolean;
  message?: string;
  sender: MessageSender;
  [key: string]: any;
}

type MessageSender = "popup" | "background" | "api";
export type MessageType =
  | "connect"
  | "connect_result"
  | "create_transaction"
  | "create_transaction_result"
  | "sign_transaction"
  | "sign_transaction_result"
  | "create_and_sign_transaction"
  | "create_and_sign_transaction_result"
  | "get_active_address"
  | "get_active_address_result"
  | "get_all_addresses"
  | "get_all_addresses_result"
  | "get_permissions"
  | "get_permissions_result";

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
