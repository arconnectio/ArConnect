window.arweave = function () {
  console.log("test");
};

declare global {
  interface Window {
    arweave: any;
  }
}

export {};
