import React, { useEffect, useRef, useState } from "react";
import { FileIcon, TrashIcon } from "@primer/octicons-react";
import { JWKInterface } from "arweave/node/lib/wallet";
import { getKeyFromMnemonic } from "arweave-mnemonic-keys";
import { useDispatch, useSelector } from "react-redux";
import { Wallet } from "../../stores/reducers/wallets";
import { setWallets, switchProfile } from "../../stores/actions";
import { RootState } from "../../stores/reducers";
import { checkPassword as checkPw, setPassword } from "../../utils/auth";
import { browser } from "webextension-polyfill-ts";
import { formatAddress } from "../../utils/url";
import {
  Button,
  Input,
  Spacer,
  Modal,
  useModal,
  useInput,
  useToasts
} from "@verto/ui";
import WalletIcon from "../../assets/wallet.svg";
import ImportIcon from "../../assets/import.svg";
import bip39 from "bip39-web-crypto";
import CryptoES from "crypto-es";
import Arweave from "arweave";
import logo from "../../assets/logo.png";
import styles from "../../styles/views/Welcome/view.module.sass";

export default function App() {
  const fileInput = useRef<HTMLInputElement>(null),
    loadWalletsModal = useModal(false),
    [seed, setSeed] = useState<string>(),
    [setupConfig, setSetupConfig] = useState<SetupConfigProps>({
      welcome: false,
      setupMode: false
    }),
    [keyfiles, setKeyfiles] = useState<
      {
        keyfile: JWKInterface;
        filename?: string;
      }[]
    >([]),
    [loading, setLoading] = useState(false),
    dispatch = useDispatch(),
    walletsStore = useSelector((state: RootState) => state.wallets),
    seedModal = useModal(false),
    [seedKeyfile, setSeedKeyfile] = useState<{
      address: string;
      keyfile: JWKInterface;
    }>(),
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    arweave = new Arweave(arweaveConfig),
    passwordInput = useInput<string>(""),
    passwordInputAgain = useInput<string>(""),
    [passwordGiven, setPasswordGiven] = useState(false),
    feeModal = useModal(false),
    loadConfigModal = useModal(),
    configPasswordInput = useInput<string>(""),
    configFileInput = useRef<HTMLInputElement>(null),
    [configFilenameDisplay, setConfigFilenameDisplay] =
      useState("Click to load"),
    [loadingConfig, setLoadingConfig] = useState(false);

  useEffect(() => {
    if (!fileInput.current) return;
    const fileInputCurrent = fileInput.current;

    fileInputCurrent.addEventListener("change", loadFiles);

    return function cleanup() {
      fileInputCurrent.removeEventListener("change", loadFiles);
    };
    // eslint-disable-next-line
  }, [fileInput.current]);

  useEffect(() => {
    if (!configFileInput.current) return;
    const fileInputCurrent = configFileInput.current;
    const updateDisplay = () =>
      setConfigFilenameDisplay(
        fileInputCurrent.files?.[0].name ?? "Click to load"
      );

    fileInputCurrent.addEventListener("change", updateDisplay);

    return function cleanup() {
      fileInputCurrent.removeEventListener("change", updateDisplay);
    };
    // eslint-disable-next-line
  }, [configFileInput.current]);

  const { setToast } = useToasts();

  function loadFiles() {
    if (fileInput.current?.files)
      for (const file of fileInput.current.files) {
        if (file.type !== "application/json") continue;
        const reader = new FileReader();

        try {
          reader.readAsText(file);
        } catch {
          setToast({
            description: `There was an error when loading ${file.name}`,
            type: "error",
            duration: 3400
          });
        }

        reader.onabort = () =>
          setToast({
            description: "File reading was aborted",
            type: "error",
            duration: 3000
          });
        reader.onerror = () =>
          setToast({
            description: "File reading has failed",
            type: "error",
            duration: 3000
          });
        reader.onload = (e) => {
          try {
            const keyfile: JWKInterface = JSON.parse(
              e!.target!.result as string
            );
            setKeyfiles((val) => [...val, { keyfile, filename: file.name }]);
          } catch {
            setToast({
              description: "There was an error when loading a keyfile",
              type: "error",
              duration: 3000
            });
          }
        };
      }
  }

  async function login() {
    if (loading) return;
    setLoading(true);
    const keyfilesToLoad: JWKInterface[] = keyfiles.map(
        ({ keyfile }) => keyfile
      ),
      wallets: Wallet[] = [],
      walletsStoreEmpty = walletsStore.length < 1;

    if (seed) {
      const keyFromSeed: JWKInterface = await getKeyFromMnemonic(seed);
      keyfilesToLoad.push(keyFromSeed);
    }

    for (let i = 0; i < keyfilesToLoad.length; i++) {
      const address = await arweave.wallets.jwkToAddress(keyfilesToLoad[i]),
        keyfile = btoa(JSON.stringify(keyfilesToLoad[i])),
        name = `Account ${i + 1 + walletsStore.length}`;

      wallets.push({ address, keyfile, name });
    }

    dispatch(setWallets([...walletsStore, ...wallets]));
    if (walletsStoreEmpty) dispatch(switchProfile(wallets[0].address));
    setLoading(false);
    loadWalletsModal.setState(false);
    setToast({
      description: "Loaded wallets",
      type: "success",
      duration: 2300
    });
    // allow time to save the wallets
    setTimeout(() => {
      loadWalletsModal.setState(false);
      setKeyfiles([]);
      if (fileInput.current) fileInput.current.value = "";
    }, 600);
  }

  async function createWallet() {
    setLoading(true);

    const mnemonic = await bip39.generateMnemonic(),
      keyfile: JWKInterface = await getKeyFromMnemonic(mnemonic),
      address = await arweave.wallets.jwkToAddress(keyfile),
      encryptedKeyfile = btoa(JSON.stringify(keyfile));

    setSeed(mnemonic);
    setSeedKeyfile({ address, keyfile });
    seedModal.setState(true);
    dispatch(
      setWallets([
        ...walletsStore,
        {
          keyfile: encryptedKeyfile,
          address,
          name: `Account ${walletsStore.length + 1}`
        }
      ])
    );
    dispatch(switchProfile(address));
    setLoading(false);
  }

  function downloadSeedWallet() {
    if (!seedKeyfile) return;
    const el = document.createElement("a");

    el.setAttribute(
      "href",
      `data:application/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(seedKeyfile.keyfile, null, 2)
      )}`
    );
    el.setAttribute("download", `arweave-keyfile-${seedKeyfile.address}.json`);
    el.style.display = "none";

    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  }

  async function createPassword() {
    if (passwordInput.state === "" || passwordInputAgain.state === "") {
      setToast({
        description: "Please fill both password fields",
        type: "error",
        duration: 3000
      });
      return;
    }
    if (passwordInput.state !== passwordInputAgain.state) {
      setToast({
        description: "The two passwords are not the same",
        type: "error",
        duration: 3000
      });
      return;
    }
    if (passwordInputAgain.state.length < 5) {
      setToast({ description: "Weak password", type: "error", duration: 3000 });
      return;
    }

    await setPassword(passwordInput.state);
    setPasswordGiven(true);
  }

  async function checkPassword() {
    setLoading(true);
    try {
      const res = await checkPw(passwordInput.state);
      if (!res) throw new Error();

      setPasswordGiven(true);
      setToast({ description: "Logged in", type: "success", duration: 2300 });
    } catch {
      setToast({
        description: "Wrong password",
        type: "error",
        duration: 3000
      });
    }
    setLoading(false);
  }

  async function loadConfig() {
    if (
      !configFileInput.current?.files ||
      configFileInput.current.files.length === 0
    )
      return setToast({
        description: "Please load your config file",
        type: "error",
        duration: 3000
      });

    // read config
    const file = configFileInput.current.files[0];

    if (file.type !== "text/plain")
      return setToast({
        description: "Invalid file format",
        type: "error",
        duration: 3000
      });

    const reader = new FileReader();

    try {
      reader.readAsText(file);
    } catch {
      setToast({
        description: `There was an error when loading ${file.name}`,
        type: "error",
        duration: 3000
      });
    }

    reader.onabort = () =>
      setToast({
        description: "File reading was aborted",
        type: "error",
        duration: 3000
      });
    reader.onerror = () =>
      setToast({
        description: "File reading has failed",
        type: "error",
        duration: 3000
      });
    reader.onload = async (e) => {
      if (!e.target?.result)
        return setToast({
          description: "Error reading the file",
          type: "error",
          duration: 3000
        });

      setLoadingConfig(true);
      // decrypt config and apply settings
      try {
        const decrypted = CryptoES.AES.decrypt(
          e.target.result as string,
          configPasswordInput.state
        );

        await setPassword(configPasswordInput.state);
        await browser.storage.local.set({
          "persist:root": decrypted.toString(CryptoES.enc.Utf8),
          decryptionKey: false
        });
        setToast({
          description: "Loaded config",
          type: "success",
          duration: 2300
        });
        setTimeout(() => window.location.reload(), 1300);
      } catch {
        setToast({
          description: "Invalid password",
          type: "error",
          duration: 3000
        });
      }
      setLoadingConfig(false);
      loadConfigModal.setState(false);
    };
  }

  const SetupPage = ({ withSetupMode }: { withSetupMode?: boolean }) => {
    return (
      <section className={styles.SetupPage}>
        <div className={styles.SetupContent}>
          <img src={logo} alt="arconnect logo" className={styles.logo} />
          <h1 className={styles.header}>Welcome to ArConnect</h1>
          <p className={styles.intro}>
            {withSetupMode
              ? "Load your ArConnect config file"
              : "A simple and secure way to authorize transactions and manage your Arweave assets"}
          </p>
          <Spacer y={1} />
          {withSetupMode ? (
            <div className={styles.SetupMode}>
              <div
                onClick={() =>
                  setSetupConfig({
                    ...setupConfig,
                    welcome: false,
                    setupMode: true
                  })
                }
              >
                <WalletIcon />
                <h5>Load or create wallets</h5>
                <p>I'm new, I want to create a new profile</p>
              </div>

              <div onClick={() => loadConfigModal.setState(true)}>
                <ImportIcon />
                <h5>Import settings</h5>
                <p>I’m just moving my stuff, I want to load my profile</p>
              </div>
            </div>
          ) : (
            <Button
              small
              onClick={() => {
                setSetupConfig({ ...setupConfig, welcome: true });
              }}
              style={{ marginTop: "2rem" }}
            >
              Get Started
            </Button>
          )}
        </div>
      </section>
    );
  };

  return (
    <>
      {setupConfig.setupMode || walletsStore.length > 0 ? (
        <div className={styles.Welcome}>
          {(passwordGiven && (
            <>
              <img src={logo} alt="arconnect logo" className={styles.logo} />
              <h1 className={styles.header}>Welcome to ArConnect</h1>
              <p className={styles.intro}>Load or create a new wallet.</p>
              <div className={styles.loadwallets}>
                <Button onClick={() => loadWalletsModal.setState(true)} small>
                  Load Wallet
                </Button>
                <Button
                  onClick={createWallet}
                  small
                  loading={loading}
                  type="secondary"
                >
                  New Wallet
                </Button>
              </div>
              <p style={{ marginTop: "1.75em" }} className={styles.fees}>
                Read more about our{" "}
                <span onClick={() => feeModal.setState(true)}>fees</span>.
              </p>
            </>
          )) || (
            <>
              <img src={logo} alt="arconnect logo" className={styles.logo} />
              <h1 className={styles.header}>Welcome to ArConnect</h1>
              <p className={styles.intro}>
                {walletsStore.length === 0
                  ? "Please create a password to use for authentication"
                  : "Login with your password"}
              </p>
              <Spacer y={1} />
              <Input
                {...passwordInput.bindings}
                onKeyPressHandler={(e) => {
                  if (e.key === "Enter" && walletsStore.length > 0) {
                    checkPassword();
                  } else if (e.key === "Enter" && walletsStore.length === 0) {
                    setToast({
                      description: "Please fill both password fields",
                      type: "error",
                      duration: 3000
                    });
                  }
                }}
                small
                type="password"
                placeholder="*********"
                label="Password"
              />
              <Spacer y={1.3} />
              {walletsStore.length === 0 && (
                <>
                  <Input
                    small
                    {...passwordInputAgain.bindings}
                    onKeyPressHandler={(e) => {
                      if (e.key === "Enter") {
                        createPassword();
                      }
                    }}
                    type="password"
                    placeholder="*********"
                    label="Repeat Password"
                  />
                  <Spacer y={2} />
                </>
              )}
              <Spacer />
              <Button
                small
                onClick={() => {
                  if (walletsStore.length === 0) createPassword();
                  else checkPassword();
                }}
                style={{ width: "15%" }}
              >
                {walletsStore.length === 0 ? "Create" : "Login"}
              </Button>
              {walletsStore.length === 0 && (
                <>
                  <span className={styles.OR}>OR</span>
                  <Button
                    type="secondary"
                    small
                    style={{ width: "14%" }}
                    onClick={() =>
                      setSetupConfig({
                        ...setupConfig,
                        welcome: true,
                        setupMode: false
                      })
                    }
                  >
                    Cancel
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      ) : setupConfig.welcome && walletsStore.length === 0 ? (
        <SetupPage withSetupMode />
      ) : (
        <SetupPage />
      )}
      <a
        className={styles.th8ta}
        href="https://th8ta.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        th<span>8</span>ta
      </a>
      <Modal
        {...loadWalletsModal.bindings}
        open={loadWalletsModal.bindings.open}
        onClose={() => {
          loadWalletsModal.setState(false);
        }}
      >
        <Modal.Title>Load wallet</Modal.Title>
        <Modal.Content>
          <h4 className={styles.ModalSubtitle}>
            Use your{" "}
            <a
              href="https://www.arweave.org/wallet"
              target="_blank"
              rel="noopener noreferrer"
            >
              Arweave keyfile
            </a>{" "}
            or seedphrase to continue.
          </h4>
          <Spacer y={0.8} />
          <textarea
            placeholder="Enter 12 word seedphrase..."
            onChange={(e) => setSeed(e.target.value)}
            className={styles.Textarea}
          ></textarea>
          <span className={styles.OR}>OR</span>
          {keyfiles.map(
            (file, i) =>
              file.filename && (
                <>
                  <div
                    className={styles.FileContent}
                    onClick={() =>
                      setKeyfiles((val) =>
                        val.filter(({ filename }) => filename !== file.filename)
                      )
                    }
                  >
                    <div className={styles.items}>
                      <TrashIcon size={24} />
                      <p className={styles.Filename}>
                        {formatAddress(file.filename, 18)}
                      </p>
                    </div>
                  </div>
                  <Spacer y={1} />
                </>
              )
          )}
          <div
            className={styles.FileContent}
            onClick={() => fileInput.current?.click()}
          >
            <div className={styles.items}>
              <FileIcon size={24} />
              {keyfiles.length > 0
                ? "Add more keyfile(s)"
                : "Load keyfile(s) from filesystem"}
            </div>
          </div>
          <Spacer y={1.65} />
          <Button
            small
            type="filled"
            onClick={login}
            loading={loading}
            style={{ margin: "0 auto" }}
          >
            Load
          </Button>
        </Modal.Content>
      </Modal>
      <Modal {...seedModal.bindings}>
        <Modal.Title>Generated a wallet</Modal.Title>
        <h4 className={styles.ModalSubtitle}>
          Make sure to remember this seedphrase
        </h4>
        <Modal.Content>
          <textarea
            value={seed}
            readOnly
            className={styles.Textarea}
          ></textarea>
          <p style={{ textAlign: "center" }} className={styles.KeyFileText}>
            ...and download your keyfile.
          </p>
          <Button
            small
            type="filled"
            onClick={downloadSeedWallet}
            className={styles.OROptionButton}
          >
            Download
          </Button>
          <span className={styles.OR}>OR</span>
          <Button
            small
            type="secondary"
            onClick={() => seedModal.setState(false)}
            className={styles.OROptionButton}
          >
            Dismiss
          </Button>
        </Modal.Content>
      </Modal>
      <Modal {...feeModal.bindings} open={feeModal.bindings.open}>
        <Modal.Title>Tips</Modal.Title>
        <Modal.Content className={styles.FeesModal}>
          <p style={{ textAlign: "justify" }}>
            We at{" "}
            <a
              href="https://th8ta.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              th8ta
            </a>{" "}
            are working hard to bring you the best experiences on the permaweb.
            Because of this, we take a small tip whenever a 3rd-party
            application utilizes ArConnect. This tip goes to a randomly-selected{" "}
            <span className={styles.CodeStyle}>VRT</span> token holder:
          </p>
          <ul>
            <li>
              <span className={styles.CodeStyle}>$0.03</span> USD-equivalent of
              AR for the first 10 transactions
            </li>
            <li>
              <span className={styles.CodeStyle}>$0.01</span> USD-equivalent of
              AR for all subsequent transactions
            </li>
          </ul>
          <p>
            Note: We do <b>not</b> charge fees on transfers made inside of the
            extension and the fee does <b>not</b> change based on the size of
            the transaction.
          </p>
        </Modal.Content>
        <Button
          small
          type="filled"
          onClick={() => feeModal.setState(false)}
          style={{ margin: "0 auto" }}
        >
          Dismiss
        </Button>
      </Modal>

      <Modal {...loadConfigModal.bindings}>
        <Modal.Title>Import settings</Modal.Title>
        <h4 className={styles.ModalSubtitle}>
          Import your settings and wallets from a generated config
        </h4>
        <Modal.Content>
          <Spacer y={0.5} />
          <p style={{ fontWeight: 500, textAlign: "center" }}>
            Important: this is for ArConnect config files,{" "}
            <b>NOT ARWEAVE KEYFILES</b>
          </p>
          <Spacer y={0.5} />
          <div
            className={styles.FileContent}
            onClick={() => configFileInput.current?.click()}
          >
            <div className={styles.items}>
              <FileIcon size={24} />
              <p className={styles.Filename}>
                {configFilenameDisplay === "Click to load"
                  ? "Click to load"
                  : formatAddress(configFilenameDisplay, 18)}
              </p>
            </div>
          </div>
          <Spacer y={2} />
          <Input
            small
            type="password"
            className={styles.FilenamePW}
            style={{ width: "50%", margin: "0 auto" }}
            placeholder="Enter password to decrypt"
            {...configPasswordInput.bindings}
            onKeyPressHandler={(e) => {
              if (e.key === "Enter") loadConfig();
            }}
          />
        </Modal.Content>
        <Spacer y={2} />
        <Button
          type="filled"
          small
          style={{ margin: "0 auto" }}
          onClick={loadConfig}
          loading={loadingConfig}
        >
          Load
        </Button>
      </Modal>

      <input
        type="file"
        className={styles.FileInput}
        ref={fileInput}
        accept=".json,application/json"
        multiple
      />
      <input type="file" className={styles.FileInput} ref={configFileInput} />
    </>
  );
}
interface SetupConfigProps {
  welcome: boolean;
  setupMode: boolean;
}
