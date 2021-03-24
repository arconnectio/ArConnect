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
  Spacer,
  Code
} from "@geist-ui/react";
import { FileIcon } from "@primer/octicons-react";
import { JWKInterface } from "arweave/node/lib/wallet";
import { generateMnemonic, getKeyFromMnemonic } from "arweave-mnemonic-keys";
import { useDispatch, useSelector } from "react-redux";
import { Wallet } from "../../stores/reducers/wallets";
import { setWallets, switchProfile } from "../../stores/actions";
import { RootState } from "../../stores/reducers";
import Arweave from "arweave";
import logo from "../../assets/logo.png";
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
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    arweave = new Arweave(arweaveConfig),
    passwordInput = useInput(""),
    passwordInputAgain = useInput(""),
    [passwordGiven, setPasswordGiven] = useState(false),
    feeModal = useModal(false);

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

    dispath(setWallets([...walletsStore, ...wallets]));
    if (walletsStoreEmpty) dispath(switchProfile(wallets[0].address));
    setLoading(false);
    loadWalletsModal.setVisible(false);
    setToast({ text: "Loaded wallets", type: "success" });
    // allow time to save the wallets
    setTimeout(() => {
      window.close();
    }, 600);
  }

  async function createWallet() {
    setLoading(true);

    const mnemonic = await generateMnemonic(),
      keyfile: JWKInterface = await getKeyFromMnemonic(mnemonic),
      address = await arweave.wallets.jwkToAddress(keyfile),
      encryptedKeyfile = btoa(JSON.stringify(keyfile));

    setSeed(mnemonic);
    setSeedKeyfile({ address, keyfile });
    seedModal.setVisible(true);
    dispath(
      setWallets([
        ...walletsStore,
        {
          keyfile: encryptedKeyfile,
          address,
          name: `Account ${walletsStore.length + 1}`
        }
      ])
    );
    dispath(switchProfile(address));
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
        atob(walletsStore[0].keyfile);
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
            <span style={{ color: theme.palette.success }}>ArConnect</span>
          </h1>
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
                onKeyPress={(e) => {
                  if (e.key === "Enter" && walletsStore.length > 0)
                    checkPassword();
                }}
                placeholder="Password..."
              />
              {walletsStore.length === 0 && (
                <>
                  <Spacer />
                  <Input.Password
                    {...passwordInputAgain.bindings}
                    placeholder="Password again..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") createPassword();
                    }}
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
          <p style={{ marginTop: "1.75em" }}>
            Read more about our{" "}
            <span
              onClick={() => feeModal.setVisible(true)}
              style={{ color: theme.palette.link, cursor: "pointer" }}
            >
              fees
            </span>
            .
          </p>
        </Card>
      </div>
      <a
        className={styles.th8ta}
        href="https://th8ta.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        th<span>8</span>ta
      </a>
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
              {keyfiles.length > 0
                ? "Add more keyfile(s)"
                : "Load keyfile(s) from filesystem"}
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
      <Modal {...feeModal.bindings}>
        <Modal.Title>Tips</Modal.Title>
        <Modal.Content>
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
            <Code>VRT</Code> token holder:
          </p>
          <ul>
            <li>
              <Code>$0.03</Code> USD-equivalent of AR for the first 10
              transactions
            </li>
            <li>
              <Code>$0.01</Code> USD-equivalent of AR for all subsequent
              transactions
            </li>
          </ul>
          <p>
            Note: We do <b>not</b> charge fees on transfers made inside of the
            extension and the fee does <b>not</b> change based on the size of
            the transaction.
          </p>
        </Modal.Content>
        <Modal.Action onClick={() => feeModal.setVisible(false)}>
          Ok
        </Modal.Action>
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
