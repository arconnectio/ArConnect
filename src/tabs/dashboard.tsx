import { useStorage } from "@plasmohq/storage/hook";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Application from "~applications/application";
import settings, { getSetting } from "~settings";
import type { ValueType } from "~settings/setting";
import type Setting from "~settings/setting";
import {
  addWallet,
  readWalletFromFile,
  removeWallet,
  StoredWallet
} from "~wallets";
import ApplicationEl from "~components/Application";

export default function App() {
  const [password, setPassword] = useState<string>("");
  const fileInput = useRef<HTMLInputElement>();

  // active wallet's address
  const [activeAddress, setActiveAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });
  const [wallets, setWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      area: "local",
      isSecret: true
    },
    []
  );

  async function addWallets() {
    if (!fileInput.current?.files) return;

    // read keyfiles
    for (const file of fileInput.current.files) {
      const wallet = await readWalletFromFile(file);

      await addWallet(wallet, password);
    }
  }

  const [activeSetting, setActiveSetting] = useState(settings[0].name);

  const [apps] = useStorage<string[]>(
    {
      key: "apps",
      area: "local",
      isSecret: true
    },
    []
  );
  const [activeApp, setActiveApp] = useState<string>();
  const app = useMemo<Application | undefined>(
    () => (activeApp ? new Application(activeApp) : undefined),
    [activeApp]
  );

  return (
    <>
      <h2>
        Wallet: (active:
        <select
          onChange={(e) => setActiveAddress(e.target.value)}
          value={activeAddress}
        >
          {wallets.map((wallet, i) => (
            <option key={i} value={wallet.address}>
              {wallet.address}
            </option>
          ))}
        </select>
        )
      </h2>
      <h2>Manage Wallets</h2>
      {wallets.map((wallet, i) => (
        <div key={i}>
          <b>{wallet.address}</b>:
          <label style={{ marginLeft: ".3em" }}>
            Nickname:{" "}
            <input
              type="text"
              value={wallet.nickname}
              onChange={(e) => {
                setWallets(
                  wallets.map((val) => {
                    if (val.address !== wallet.address) return val;
                    else
                      return {
                        ...val,
                        nickname: e.target.value
                      };
                  })
                );
              }}
            />
          </label>
          <button onClick={() => removeWallet(wallet.address)}>Remove</button>
        </div>
      ))}
      <h3>Add</h3>
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
      <h2>Applications</h2>
      {apps.length === 0 && <p>No apps connected yet...</p>}
      {apps.map((url, i) => (
        <div key={i} onClick={() => setActiveApp(url)}>
          <button>{url}</button>
          <br />
        </div>
      ))}
      {app && <ApplicationEl app={app} />}
      {/**<button onClick={() => addApp({
        url: "https://verto.exchange",
        name: "Verto",
        logo: "https://www.verto.exchange/logo_light.svg",
        permissions: ["ACCESS_ADDRESS", "ACCESS_ALL_ADDRESSES"]
      })}>add</button>**/}
    </>
  );
}

const SettingEl = ({ setting }: { setting: Setting }) => {
  const [val, setVal] = useState(setting.defaultValue);

  useEffect(() => {
    (async () => {
      const val = await setting.getValue();
      setVal(val);
    })();
  }, [setting]);

  async function updateSetting(newVal: ValueType) {
    setVal(newVal);
    await setting.setValue(newVal);
  }

  return (
    <>
      {(setting.type === "boolean" && (
        <input
          type="checkbox"
          checked={val as boolean}
          onChange={(e) => updateSetting(e.target.checked)}
        />
      )) ||
        (setting.type === "number" && (
          <input
            type="number"
            value={val as number}
            onChange={(e) => updateSetting(Number(e.target.value))}
          />
        )) ||
        (setting.type === "string" && (
          <input
            type="text"
            value={val as string}
            onChange={(e) => updateSetting(e.target.value)}
          />
        )) ||
        (setting.type === "pick" && (
          <select
            onChange={(e) => updateSetting(e.target.value)}
            value={val.toString()}
          >
            {setting.options.map((option, i) => (
              <option value={option.toString()} key={i}>
                {option === false ? "off" : option}
              </option>
            ))}
          </select>
        ))}
    </>
  );
};
