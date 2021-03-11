export interface MessageFormat {
  type: MessageType;
  ext: "arconnect";
  res?: boolean;
  message?: string;
  sender: MessageSender;
  [key: string]: any;
}

type MessageSender = "popup" | "background" | "api";
export type MessageType =
  | "connect"
  | "connect_result"
  | "disconnect"
  | "disconnect_result"
  | "sign_transaction"
  | "sign_transaction_result"
  | "sign_auth"
  | "sign_auth_result"
  | "get_active_address"
  | "get_active_address_result"
  | "get_all_addresses"
  | "get_all_addresses_result"
  | "get_wallet_names"
  | "get_wallet_names_result"
  | "get_permissions"
  | "get_permissions_result"
  | "switch_wallet_event"
  | "switch_wallet_event_forward";

// the sendMessage function provides an easier messaging functionality
// we use this function everywhere, and it returns the desired messaging
// functionality based on the input data
export function sendMessage(
  message: MessageFormat,
  responseCallback?: (res: MessageFormat) => void,
  doResponse?: (response?: any) => void,
  runtime: boolean = true,
  targetTabID?: number
) {
  if (doResponse) return doResponse(message); // reply in the chrome.runtime.onMessage listener
  if (runtime) {
    // message with chrome.runtime or chrome.tabs
    if (!targetTabID) chrome.runtime.sendMessage(message, responseCallback);
    // send message to popup or background script
    else chrome.tabs.sendMessage(targetTabID, message, responseCallback); // send message to content script
  } else window.postMessage(message, window.location.origin); // communication between content script - api (injected script)
}

// this function validates messages and check if they are from the extension
// other extensions could interfer with the functionality of ArConnect
// for example with the window.postMessage function
// this ensures that that does not happen
export function validateMessage(
  message: any,
  { sender, type }: { sender?: MessageSender; type?: MessageType }
) {
  if (!message) return false;
  if (
    !message.ext ||
    message.ext !== "arconnect" ||
    !message.sender ||
    !message.type
  )
    return false;
  if (sender && message.sender !== sender) return false;
  if (type && message.type !== type) return false;
  return true;
}
