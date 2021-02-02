import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  useTheme,
  Button,
  useModal,
  Modal,
  Textarea,
  useToasts,
  Tooltip
} from "@geist-ui/react";
import { FileIcon } from "@primer/octicons-react";
import { JWKInterface } from "arweave/node/lib/wallet";
import { getKeyFromMnemonic } from "arweave-mnemonic-keys";
import { useDispatch } from "react-redux";
import { Wallet } from "../../stores/reducers/wallets";
import { setWallets } from "../../stores/actions";
import Arweave from "arweave";
import weaveid_logo from "../../assets/weaveid.png";
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
    dispath = useDispatch();

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
      arweave = new Arweave({
        host: "arweave.net",
        port: 443,
        protocol: "https"
      }),
      wallets: Wallet[] = [];

    if (seed) {
      const keyFromSeed: JWKInterface = await getKeyFromMnemonic(seed);
      keyfilesToLoad.push(keyFromSeed);
    }

    for (let i = 0; i < keyfilesToLoad.length; i++) {
      const address = await arweave.wallets.jwkToAddress(keyfilesToLoad[i]),
        keyfile = keyfilesToLoad[i],
        name = `Account ${i + 1}`;

      wallets.push({ address, keyfile, name });
    }

    dispath(setWallets(wallets));
    setLoading(false);
    loadWalletsModal.setVisible(false);
    setToast({ text: "Loaded wallets", type: "success" });
  }

  async function weaveIDLogin() {
    setToast({ text: "WeaveID is not yet implemented.", type: "error" });
  }

  return (
    <>
      <div className={styles.Welcome}>
        <Card className={styles.Card}>
          <h1>
            Welcome to{" "}
            <span style={{ color: theme.palette.success }}>WeaveMask</span>
          </h1>
          <p style={{ color: theme.palette.accents_4 }}>
            Secure wallet management for Arweave
          </p>
          <div className={styles.Actions}>
            <Button onClick={() => loadWalletsModal.setVisible(true)}>
              Load wallet(s)
            </Button>
            <Button>New wallet</Button>
          </div>
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
          Submit
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
