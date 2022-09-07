import { useStorage } from "@plasmohq/storage";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { addWallet, readWalletFromFile } from "~utils/wallet";

const App = () => {
  const [password, setPassword] = useState<string>("");
  const fileInput = useRef<HTMLInputElement>();

  // active wallet's address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local"
  });

  async function addWallets() {
    if (!fileInput.current?.files) return;

    // read keyfiles
    for (const file of fileInput.current.files) {
      const wallet = await readWalletFromFile(file);

      await addWallet(wallet, password);
    }
  }

  return (
    <>
      <h2>Wallet: (active: {activeAddress})</h2>
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
