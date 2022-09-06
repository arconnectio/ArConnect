import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Storage, useStorage } from "@plasmohq/storage";
import { encryptWallet, readWalletFromFile } from "~utils/security";
import type { StoredWallet } from "~utils/wallet"

const App = () => {
  const [password, setPassword] = useState<string>("");
  const fileInput = useRef<HTMLInputElement>();
  const [wallets, setWallets] = useStorage<StoredWallet[]>({
    key: "wallets",
    area: "local",
    isSecret: true
  });

  async function addWallets() {
    if (!fileInput.current?.files) return;

    const keyfiles: string[] = [];

    // read keyfiles
    for (const file of fileInput.current.files) {
      const wallet = await readWalletFromFile(file);

      keyfiles.push(await encryptWallet(wallet, password));
    }

    // save encrypted wallets
    const storage = new Storage({
      area: "local",
      secretKeyList: ["shield-modulation"]
    });

    await storage.set("wallets", JSON.stringify(keyfiles));
  }

  return (
    <>
      <h2>Wallet:</h2>
      <input
        type="file"
        ref={fileInput}
        accept=".json,application/json"
        multiple
      />
      <input
        type="password"
        placeholder="Password..."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={addWallets}>Add</button>
    </>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
