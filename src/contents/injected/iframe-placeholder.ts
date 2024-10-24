// This file is just a placeholder with some pseudo-code for the injected code on ArConnect Embedded. That is, the code
// that's loaded in the consumer site's context.

import { replaceArProtocolLinks } from "~api/foreground/foreground-setup-ar-protocol-links";
import { setupEventListeners } from "~api/foreground/foreground-setup-events";
import { setupWalletSDK } from "~api/foreground/foreground-setup-wallet-sdk";

// Create the iframe:

const iframeElement = document.createElement("iframe");

iframeElement.id = "arConnectEmbeddedIframe";
iframeElement.src = "https://<CLIENT_ID?>.embedded.arconnect.io/";

document.body.appendChild(iframeElement);

// api.ts:

// Because in ArConnect Embedded the injected code is not sandboxed, we can simply call `injectWalletSDK()` instead of
// having to inject `injected.ts` with a `<script>` tag to call it outside the sandbox:
setupWalletSDK(iframeElement.contentWindow);

// events.ts:

// In ArConnect Embedded, we need to listen for messages coming from the iframe itself, so we pass a reference to it to
// `setupEventListeners()` to check that:
setupEventListeners(iframeElement);

// ar_protocol.ts:

document.addEventListener("DOMContentLoaded", async () => {
  replaceArProtocolLinks();
});

// TODO: Document message flow.

// TODO: ArConnect Mobile also needs to call injected.ts, ar_protocol.ts and events.ts, so these changes can be reused.

// TODO: Add env variables to log auth flow?
