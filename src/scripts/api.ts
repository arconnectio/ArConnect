import { sendMessage, validateMessage } from "../utils/messenger";
import { PermissionType } from "../utils/permissions";
import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave";

function createOverlay(text: string) {
  const container = document.createElement("div");
  container.innerHTML = `
    <div style="position: fixed; top: 0; bottom: 0; left: 0; right: 0; z-index: 1000000000000; background-color: rgba(0, 0, 0, .73); font-family: 'Inter', sans-serif;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff;">
        <h1 style="text-align: center; margin: 0; font-size: 3em; font-weight: 600; margin-bottom: .35em; line-height: 1em;">Arweave</h1>
        <p style="text-align: center; font-size: 1.2em; font-weight: 500;">${text}</p>
      </div>
    </div>
  `;

  return container;
}

// animation on transaction event
function createCoinWithAnimation() {
  const arCoin = document.createElement("img"),
    pos = { x: 0, y: 0 },
    id = `ar-coin-animation-${
      document.querySelectorAll(".ar-coing-animation").length
    }`;
  let visibility = 100;

  arCoin.setAttribute("src", "https://www.arweave.org/favicon-183x183.png");
  arCoin.setAttribute("alt", "a");
  arCoin.style.position = "fixed";
  arCoin.style.bottom = "0";
  arCoin.style.right = `${Math.floor(Math.random() * 30)}px`;
  arCoin.style.width = "18px";
  arCoin.style.zIndex = "1000000";
  arCoin.style.transition = "all .23s ease";
  arCoin.id = id;
  arCoin.classList.add("ar-coing-animation");
  document.body.appendChild(arCoin);

  // @ts-ignore
  const animation = setInterval(() => {
    if (visibility < 0) {
      document.querySelector(`#${id}`)?.remove();
      return clearInterval(animation);
    }

    visibility -= 6.5;
    pos.x += Math.floor(Math.random() * 30) - 10;
    pos.y += Math.floor(Math.random() * 24);
    arCoin.style.transform = `translate(-${pos.x}px, -${pos.y}px)`;
    arCoin.style.opacity = `${visibility / 100}`;
  }, 100);
}

const WalletAPI = {
  connect(permissions: PermissionType[]): Promise<void> {
    const requestPermissionOverlay = createOverlay(
      "This page is requesting permission to connect to your wallet...<br />Please review them in the popup."
    );

    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "connect", ext: "arconnect", sender: "api", permissions },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);
      document.body.appendChild(requestPermissionOverlay);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "connect_result" })) return;
        window.removeEventListener("message", callback);
        document.body.removeChild(requestPermissionOverlay);

        if (e.data.res) resolve();
        else reject(e.data.message);
      }
    });
  },
  getActiveAddress(): Promise<string> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "get_active_address", ext: "arconnect", sender: "api" },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "get_active_address_result" }))
          return;
        window.removeEventListener("message", callback);

        if (e.data.address) resolve(e.data.address);
        else reject(e.data.message);
      }
    });
  },
  getAllAddresses(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "get_all_addresses", ext: "arconnect", sender: "api" },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "get_all_addresses_result" }))
          return;
        window.removeEventListener("message", callback);

        if (e.data.addresses) resolve(e.data.addresses);
        else reject(e.data.message);
      }
    });
  },
  sign(
    transaction: Transaction,
    options?: SignatureOptions
  ): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const arweave = new Arweave({
        host: "arweave.net",
        port: 443,
        protocol: "https"
      });

      sendMessage(
        {
          type: "sign_transaction",
          ext: "arconnect",
          sender: "api",
          transaction,
          signatureOptions: options
        },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (
          !validateMessage(e.data, {
            type: "sign_transaction_result"
          })
        )
          return;
        window.removeEventListener("message", callback);

        if (e.data.res && e.data.transaction) {
          const decodeTransaction = arweave.transactions.fromRaw(
            e.data.transaction
          );

          if (e.data.arConfetti) {
            for (let i = 0; i < 8; i++)
              setTimeout(() => createCoinWithAnimation(), i * 150);
          }
          resolve(decodeTransaction);
        } else reject(e.data.message);
      }
    });
  },
  getPermissions(): Promise<PermissionType[]> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "get_permissions", ext: "arconnect", sender: "api" },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "get_permissions_result" }))
          return;
        window.removeEventListener("message", callback);

        if (e.data.permissions) resolve(e.data.permissions);
        else reject(e.data.message);
      }
    });
  },
  encrypt(data: string, algorithm: string, hash: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      sendMessage(
        {
          type: "encrypt",
          ext: "arconnect",
          sender: "api",
          data,
          algorithm,
          hash
        },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "encrypt_result" })) return;
        window.removeEventListener("message", callback);

        if (e.data.res) resolve(e.data.res);
        else reject(e.data.message);
      }
    });
  },
  decrypt(data: Uint8Array, algorithm: string, hash: string): Promise<string> {
    return new Promise((resolve, reject) => {
      sendMessage(
        {
          type: "decrypt",
          ext: "arconnect",
          sender: "api",
          data,
          algorithm,
          hash
        },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "decrypt_result" })) return;
        window.removeEventListener("message", callback);

        if (e.data.res) resolve(e.data.res);
        else reject(e.data.message);
      }
    });
  }
};

// listen to wallet switch event and dispatch it
window.addEventListener("message", (e) => {
  if (
    !e.data ||
    !e.data.type ||
    e.data.type !== "switch_wallet_event_forward" ||
    !e.data.address
  )
    return;
  dispatchEvent(
    new CustomEvent("walletSwitch", { detail: { address: e.data.address } })
  );
});

window.arweaveWallet = WalletAPI;
dispatchEvent(new CustomEvent("arweaveWalletLoaded", { detail: {} }));

declare global {
  interface Window {
    arweaveWallet: typeof WalletAPI;
  }
  interface WindowEventMap {
    walletSwitch: CustomEvent<{ address: string }>;
    arweaveWalletLoaded: CustomEvent<{}>;
  }
}

export {};
