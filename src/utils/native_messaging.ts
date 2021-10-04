import { browser } from "webextension-polyfill-ts";

let nativeMessagingPort: any = null;

const connectToNativeApp = (): any => {
  const hostName = "com.arweave.arconnect";
  nativeMessagingPort = browser.runtime.connectNative(hostName);
  if (nativeMessagingPort) {
    nativeMessagingPort.onDisconnect.addListener(() => {
      nativeMessagingPort = null;
      // TODO: Update UI?
    });
  }

  return nativeMessagingPort;
};

const isConnectedToNativeApp = (): boolean => {
  return nativeMessagingPort ? true : false;
};

export { connectToNativeApp, isConnectedToNativeApp };
