import { useStorage } from "@plasmohq/storage";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import settings, { getSetting } from "~settings"
import type { ValueType } from "~settings/setting"
import type Setting from "~settings/setting"
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

  const [activeSetting, setActiveSetting] = useState(settings[0].name);

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
      <h2>Settings</h2>
      {settings.map((setting, i) => (
        <button key={i} onClick={() => setActiveSetting(setting.name)}>
          {setting.displayName}
        </button>
      ))}
      <SettingEl setting={getSetting(activeSetting)} />
    </>
  );
};

const SettingEl = ({ setting }: { setting: Setting }) => {
  const [val, setVal] = useState(setting.defaultValue);

  useEffect(() => {
    (async () => {
      const val = await setting.getValue();
console.log(val)
      setVal(val);
    })();
  }, [setting]);

  async function updateSetting(newVal: ValueType) {
    if (setting.type === "boolean" || ["true", "false"].includes(newVal as any)) {
      newVal = newVal === "true";
    }

    setVal(newVal);
    await setting.setValue(newVal);
  }

  return (
    <>
      {(setting.type === "boolean" && (
        <input type="checkbox" checked={!!val} onChange={(e) => updateSetting(e.target.checked)} />
      )) || (setting.type === "number" && (
        <input type="number" value={val as number} onChange={(e) => updateSetting(Number(e.target.value))} />
      )) || (setting.type === "string" && (
        <input type="text" value={val as string} onChange={(e) => updateSetting(e.target.value)} />
      )) || (setting.type === "pick" && (
        <select onChange={(e) => updateSetting(e.target.value)}>
          {setting.options.map((option, i) => (
            <option value={option.toString()} key={i} selected={option.toString() === val.toString()}>{option === false ? "off" : option}</option>
          ))}
        </select>
      ))}
    </>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
