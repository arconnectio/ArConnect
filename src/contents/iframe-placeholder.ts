// This file is just a placeholder with some pseudo-code for the injected code on ArConnect Embedded. That is, the code
// that's loaded in the consumer site's context.

import { injectWalletSDK } from "~api/foreground/foreground-setup";

// api.ts:

// Because in ArConnect Embedded the injected code is not sandboxed, we can simply call `injectWalletSDK()` instead of
// having to inject `injected.ts` with a `<script>` tag to call it outside the sandbox:
injectWalletSDK();

// events.ts:

// Some backend handlers (`src/api/background/handlers/*`) will use `sendMessage(...)` to communicate with the
// `event.ts` content script, which in turn calls `postMessage()`, dispatches events or performs certain actions in the
// content script's context.
//
// In ArConnect Embedded, instead of using `onMessage`, we should listen for messages coming from the iframe itself.
// This also means that the background scripts, which in ArConnect Embedded run directly inside the iframe, need to be
// updated to send messages using `postMessage`.
//
// See https://stackoverflow.com/questions/16266474/javascript-listen-for-postmessage-events-from-specific-iframe

// TODO: listenForEvents();

// ar_protocol.ts:

// TODO: The same logic needs to run for ArConnect Embedded.
