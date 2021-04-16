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
  | "encrypt"
  | "encrypt_result"
  | "encrypt_auth"
  | "encrypt_auth_result"
  | "decrypt"
  | "decrypt_result"
  | "decrypt_auth"
  | "decrypt_auth_result"
  | "signature"
  | "signature_result"
  | "signature_auth"
  | "signature_auth_result"
  | "get_active_address"
  | "get_active_address_result"
  | "get_all_addresses"
  | "get_all_addresses_result"
  | "get_wallet_names"
  | "get_wallet_names_result"
  | "get_permissions"
  | "get_permissions_result"
  | "add_token"
  | "add_token_result"
  | "switch_wallet_event"
  | "switch_wallet_event_forward"
  | "get_arweave_config"
  | "get_arweave_config_result";

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
