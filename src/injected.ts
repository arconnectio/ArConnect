window.test = "testtt";
console.log("test");

// at the end of the injected script,
// we dispatch the wallet loaded event
dispatchEvent(new CustomEvent("arweaveWalletLoaded", { detail: {} }));

export {};
