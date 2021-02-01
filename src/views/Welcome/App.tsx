import React, { useRef, useState } from "react";
import {
  Card,
  useTheme,
  Button,
  useModal,
  Modal,
  Textarea
} from "@geist-ui/react";
import { FileIcon } from "@primer/octicons-react";
import styles from "../../styles/views/Welcome/view.module.sass";

export default function App() {
  const theme = useTheme(),
    fileInput = useRef<HTMLInputElement>(null),
    loadWalletsModal = useModal(false),
    [seed, setSeed] = useState<string>();

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
          <Card
            className={styles.FileContent}
            onClick={() => fileInput.current?.click()}
            style={{ display: "flex", alignItems: "center" }}
          >
            <FileIcon size={24} /> Load your keyfile
          </Card>
        </Modal.Content>
        <Modal.Action
          passive
          onClick={() => loadWalletsModal.setVisible(false)}
        >
          Cancel
        </Modal.Action>
        <Modal.Action>Submit</Modal.Action>
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
