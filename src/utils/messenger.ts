export interface MessageFormat {
  type: string;
  origin: MessageOrigin;
  ext: "arconnect";
  error?: boolean;
  data?: any;
}

type MessageOrigin = "popup" | "background" | "content" | "injected";

/**
 * Validate extension messages to ensure they are from ArConnect
 * with the required parameters
 *
 * @param message The message object to validate
 * @param origin Message origin (popup, background, content, injected)
 * @param type Message type (e.g. "switch_wallet_event_forward")
 */
export const validateMessage = (
  message: any,
  origin?: MessageOrigin,
  type?: string
) =>
  message &&
  message.ext === "arconnect" &&
  (!origin || (message.origin && message.origin === origin)) &&
  (!type || (message.type && message.type === type));
