import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  useTheme,
  Button,
  useModal,
  Modal,
  Textarea,
  useToasts,
  Tooltip,
  useInput,
  Input,
  Spacer
} from "@geist-ui/react";
import { FileIcon } from "@primer/octicons-react";
import { JWKInterface } from "arweave/node/lib/wallet";
import { generateMnemonic, getKeyFromMnemonic } from "arweave-mnemonic-keys";
import { useDispatch, useSelector } from "react-redux";
import { Wallet } from "../../stores/reducers/wallets";
import { setWallets, switchProfile } from "../../stores/actions";
import { RootState } from "../../stores/reducers";
import Cryptr from "cryptr";
import Arweave from "arweave";
import weaveid_logo from "../../assets/weaveid.png";
import logo from "../../assets/logo.svg";
import styles from "../../styles/views/Welcome/view.module.sass";

export default function App() {
  const theme = useTheme(),
    fileInput = useRef<HTMLInputElement>(null),
    loadWalletsModal = useModal(false),
    [seed, setSeed] = useState<string>(),
    [, setToast] = useToasts(),
    [keyfiles, setKeyfiles] = useState<
      {
        keyfile: JWKInterface;
        filename?: string;
      }[]
    >([]),
    [loading, setLoading] = useState(false),
    dispath = useDispatch(),
    walletsStore = useSelector((state: RootState) => state.wallets),
    seedModal = useModal(false),
    [seedKeyfile, setSeedKeyfile] = useState<{
      address: string;
      keyfile: JWKInterface;
    }>(),
    arweave = new Arweave({
      host: "arweave.net",
      port: 443,
      protocol: "https"
    }),
    passwordInput = useInput(""),
    passwordInputAgain = useInput(""),
    [passwordGiven, setPasswordGiven] = useState(false);

  useEffect(() => {
    if (!fileInput.current) return;
    let fileInputCurrent = fileInput.current;

    fileInputCurrent.addEventListener("change", loadFiles);

    return function cleanup() {
      fileInputCurrent.removeEventListener("change", loadFiles);
    };
    // eslint-disable-next-line
  }, [fileInput.current]);

  function loadFiles() {
    if (fileInput.current?.files)
      for (const file of fileInput.current.files) {
        if (file.type !== "application/json") continue;
        const reader = new FileReader();

        try {
          reader.readAsText(file);
        } catch {
          setToast({
            text: `There was an error when loading ${file.name}`,
            type: "error"
          });
        }

        reader.onabort = () =>
          setToast({ text: "File reading was aborted", type: "error" });
        reader.onerror = () =>
          setToast({ text: "File reading has failed", type: "error" });
        reader.onload = (e) => {
          try {
            const keyfile: JWKInterface = JSON.parse(
              e!.target!.result as string
            );
            setKeyfiles((val) => [...val, { keyfile, filename: file.name }]);
          } catch {
            setToast({
              text: "There was an error when loading a keyfile",
              type: "error"
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
      wallets: Wallet[] = [];

    if (seed) {
      const keyFromSeed: JWKInterface = await getKeyFromMnemonic(seed);
      keyfilesToLoad.push(keyFromSeed);
    }

    for (let i = 0; i < keyfilesToLoad.length; i++) {
      const address = await arweave.wallets.jwkToAddress(keyfilesToLoad[i]),
        cryptr = new Cryptr(passwordInput.state),
        keyfile = cryptr.encrypt(JSON.stringify(keyfilesToLoad[i])),
        name = `Account ${i + 1}`;

      wallets.push({ address, keyfile, name });
    }

    dispath(setWallets([...walletsStore, ...wallets]));
    dispath(switchProfile(wallets[0].address));
    setLoading(false);
    loadWalletsModal.setVisible(false);
    setToast({ text: "Loaded wallets", type: "success" });
    window.close();
  }

  async function weaveIDLogin() {
    setToast({ text: "WeaveID is not yet implemented.", type: "error" });
  }

  async function createWallet() {
    setLoading(true);

    const mnemonic = await generateMnemonic(),
      keyfile: JWKInterface = await getKeyFromMnemonic(mnemonic),
      address = await arweave.wallets.jwkToAddress(keyfile),
      cryptr = new Cryptr(passwordInput.state),
      encryptedKeyfile = cryptr.encrypt(JSON.stringify(keyfile));

    setSeed(mnemonic);
    setSeedKeyfile({ address, keyfile });
    seedModal.setVisible(true);
    dispath(
      setWallets([
        ...walletsStore,
        {
          keyfile: encryptedKeyfile,
          address,
          name: `Account ${walletsStore.length}`
        }
      ])
    );
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

  function createPassword() {
    if (passwordInput.state === "" || passwordInputAgain.state === "") {
      setToast({ text: "Please fill both password fields", type: "error" });
      return;
    }
    if (passwordInput.state !== passwordInputAgain.state) {
      setToast({ text: "The two passwords are not the same", type: "error" });
      return;
    }
    if (passwordInputAgain.state.length < 5) {
      setToast({ text: "Weak password", type: "error" });
      return;
    }
    setPasswordGiven(true);
  }

  function checkPassword() {
    setLoading(true);
    // we need to wait a bit, because the decrypting
    // freezes the program, and the loading does not start
    setTimeout(() => {
      try {
        const cryptr = new Cryptr(passwordInput.state);

        cryptr.decrypt(walletsStore[0].keyfile);
        setPasswordGiven(true);
        setToast({ text: "Logged in", type: "success" });
      } catch {
        setToast({ text: "Wrong password", type: "error" });
      } finally {
        setLoading(false);
      }
    }, 100);
  }

  return (
    <>
      <div className={styles.Welcome}>
        <Card className={styles.Card}>
          <img src={logo} alt="logo" className={styles.Logo} />
          <h1>
            Welcome to{" "}
            <span style={{ color: theme.palette.success }}>WeaveMask</span>
          </h1>
          <h2 className={styles.th8ta}>
            by Th<span>8</span>ta
          </h2>
          <p style={{ color: theme.palette.accents_4 }}>
            Secure wallet management for Arweave
            {!passwordGiven && (
              <>
                <br />
                {walletsStore.length === 0
                  ? "Please create a password to encrypt your keyfiles"
                  : "Please enter your password"}
              </>
            )}
          </p>
          {(passwordGiven && (
            <div className={styles.Actions}>
              <Button onClick={() => loadWalletsModal.setVisible(true)}>
                Load wallet(s)
              </Button>
              <Button onClick={createWallet} loading={loading}>
                New wallet
              </Button>
            </div>
          )) || (
            <>
              <Input.Password
                {...passwordInput.bindings}
                placeholder="Password..."
              />
              {walletsStore.length === 0 && (
                <>
                  <Spacer />
                  <Input.Password
                    {...passwordInputAgain.bindings}
                    placeholder="Password again..."
                  />
                </>
              )}
              <Spacer />
              <Button
                onClick={() => {
                  if (walletsStore.length === 0) createPassword();
                  else checkPassword();
                }}
                loading={loading}
              >
                {walletsStore.length === 0 ? "Create" : "Login"}
              </Button>
            </>
          )}
        </Card>
      </div>
      <Modal {...loadWalletsModal.bindings}>
        <Modal.Title>Load wallet(s)</Modal.Title>
        <Modal.Subtitle>
          Use your{" "}
          <a
            href="https://www.arweave.org/wallet"
            target="_blank"
            rel="noopener noreferrer"
          >
            Arweave keyfile
          </a>{" "}
          or seedphrase to continue.
        </Modal.Subtitle>
        <Modal.Content>
          <Textarea
            placeholder="Enter 12 word seedphrase..."
            onChange={(e) => setSeed(e.target.value)}
            className={styles.Seed}
          ></Textarea>
          <span className={styles.OR}>OR</span>
          <Button
            type="secondary"
            className={styles.WeaveIDButton}
            onClick={weaveIDLogin}
          >
            <img src={weaveid_logo} alt="weaveid-logo" />
            WeaveID
          </Button>
          <span className={styles.OR}>OR</span>
          {keyfiles.map(
            (file, i) =>
              file.filename && (
                <Tooltip
                  text="Click to remove."
                  placement="right"
                  key={i}
                  style={{ width: "100%" }}
                >
                  <Card
                    className={styles.FileContent}
                    onClick={() =>
                      setKeyfiles((val) =>
                        val.filter(({ filename }) => filename !== file.filename)
                      )
                    }
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <div className={styles.items}>
                      <p className={styles.Filename}>{file.filename}</p>
                    </div>
                  </Card>
                </Tooltip>
              )
          )}
          <Card
            className={styles.FileContent}
            onClick={() => fileInput.current?.click()}
            style={{ display: "flex", alignItems: "center" }}
          >
            <div className={styles.items}>
              <FileIcon size={24} />
              {keyfiles.length > 0 ? "Add more keyfile(s)" : "Load keyfile(s)"}
            </div>
          </Card>
        </Modal.Content>
        <Modal.Action
          passive
          onClick={() => loadWalletsModal.setVisible(false)}
        >
          Cancel
        </Modal.Action>
        <Modal.Action onClick={login} loading={loading}>
          Load
        </Modal.Action>
      </Modal>
      <Modal {...seedModal.bindings}>
        <Modal.Title>Generated a wallet</Modal.Title>
        <Modal.Subtitle>Make sure to remember this seedphrase</Modal.Subtitle>
        <Modal.Content>
          <Textarea
            value={seed}
            readOnly
            className={styles.Seed + " " + styles.NewSeed}
          ></Textarea>
          <p style={{ textAlign: "center" }}>...and download your keyfile.</p>
          <Button onClick={downloadSeedWallet} style={{ width: "100%" }}>
            Download
          </Button>
        </Modal.Content>
        <Modal.Action onClick={() => window.close()}>Ok</Modal.Action>
      </Modal>
      <input
        type="file"
        className={styles.FileInput}
        ref={fileInput}
        accept=".json,application/json"
        multiple
      />
    </>
  );
}
