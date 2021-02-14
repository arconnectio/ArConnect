import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import { Button, Input, Spacer, useInput, useToasts } from "@geist-ui/react";
import { goTo } from "react-chrome-extension-router";
import { local } from "chrome-storage-promises";
import { JWKInterface } from "arweave/node/lib/wallet";
import Cryptr from "cryptr";
import Home from "./Home";
import Arweave from "arweave";
import axios from "axios";
import WalletManager from "../../../components/WalletManager";
import styles from "../../../styles/views/Popup/send.module.sass";

export default function Send() {
  const targetInput = useInput(""),
    amountInput = useInput("0"),
    messageInput = useInput(""),
    passwordInput = useInput(""),
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    arweave = new Arweave(arweaveConfig),
    [fee, setFee] = useState("0"),
    profile = useSelector((state: RootState) => state.profile),
    currentWallet = useSelector((state: RootState) => state.wallets).find(
      ({ address }) => address === profile
    )?.keyfile,
    [balance, setBalance] = useState("0"),
    [submitted, setSubmitted] = useState(false),
    [loading, setLoading] = useState(false),
    [, setToast] = useToasts(),
    [decryptKey, setDecryptKey] = useState("");

  useEffect(() => {
    loadBalance();
    loadDecryptKey();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    calculateFee();
    // eslint-disable-next-line
  }, [targetInput.state, messageInput.state, profile]);

  async function loadBalance() {
    try {
      const arBalance = arweave.ar.winstonToAr(
        await arweave.wallets.getBalance(profile)
      );

      setBalance(arBalance);
    } catch {}
  }

  async function calculateFee() {
    try {
      const messageSize = new TextEncoder().encode(messageInput.state).length,
        { data } = await axios.get(
          `https://arweave.net/price/${messageSize}/${targetInput.state}`
        );
      setFee(arweave.ar.winstonToAr(data));
    } catch {}
  }

  async function loadDecryptKey() {
    const decryptKeyStored: { [key: string]: any } =
        typeof chrome !== "undefined"
          ? await local.get("decryptionKey")
          : await browser.storage.local.get("decryptionKey"),
      decryptKeyIs = decryptKeyStored?.["decryptionKey"];

    setDecryptKey(decryptKeyIs ?? "");
  }

  function checkPassword() {
    setLoading(true);
    if (!currentWallet) return;
    setTimeout(() => {
      try {
        const cryptr = new Cryptr(passwordInput.state);
        cryptr.decrypt(currentWallet);
        setDecryptKey(passwordInput.state);
        if (typeof chrome !== "undefined")
          local.set({ decryptionKey: passwordInput.state });
        else browser.storage.local.set({ decryptionKey: passwordInput.state });
      } catch {}
      setLoading(false);
    }, 80);
  }

  async function send() {
    setSubmitted(true);
    if (
      targetInput.state === "" ||
      amountInput.state === "" ||
      Number(amountInput.state) > Number(balance)
    )
      return;
    setLoading(true);
    if (!currentWallet || !decryptKey)
      return setToast({ text: "No decrypt key", type: "error" });

    try {
      const cryptr = new Cryptr(decryptKey),
        keyfile: JWKInterface = JSON.parse(cryptr.decrypt(currentWallet)),
        transaction = await arweave.createTransaction(
          {
            target: targetInput.state,
            quantity: arweave.ar.arToWinston(amountInput.state),
            data:
              messageInput.state !== ""
                ? Buffer.from(messageInput.state, "utf-8")
                : undefined
          },
          keyfile
        );

      transaction.addTag("App-Name", "WeaveMask");
      await arweave.transactions.sign(transaction, keyfile);

      const res = await arweave.transactions.post(transaction);

      if (res.status === 200)
        setToast({ text: "Sent transaction", type: "success" });
      else throw new Error("");

      targetInput.setState("");
      amountInput.setState("");
      messageInput.setState("");
      setSubmitted(false);
    } catch {
      setToast({ text: "Error sending transaction", type: "error" });
    }
    setLoading(false);
  }

  return (
    <>
      <WalletManager />
      <div className={styles.View}>
        {(decryptKey !== "" && (
          <>
            <Input
              {...targetInput.bindings}
              placeholder="Send to address..."
              status={
                submitted && targetInput.state === "" ? "error" : "default"
              }
            />
            <Spacer />
            <div className={styles.Amount}>
              <Input
                {...amountInput.bindings}
                placeholder="Amount"
                labelRight="AR"
                type="number"
                min="0"
                status={
                  submitted &&
                  (amountInput.state === "" ||
                    Number(amountInput.state) > Number(balance))
                    ? "error"
                    : "default"
                }
              />
              <Button
                style={{
                  paddingLeft: ".5em",
                  paddingRight: ".5em",
                  minWidth: "unset",
                  height: "2.65em",
                  lineHeight: "unset"
                }}
                onClick={() =>
                  amountInput.setState(
                    (Number(balance) - Number(fee)).toString()
                  )
                }
              >
                Max
              </Button>
            </div>
            <Spacer />
            <Input
              {...messageInput.bindings}
              placeholder="Message (optional)"
            />
            <p>Fee: {fee} AR</p>
            <p>Total: {Number(fee) + Number(amountInput.state)} AR</p>
            <Button
              style={{ width: "100%" }}
              type="success"
              onClick={send}
              loading={loading}
            >
              Send AR
            </Button>
            <Spacer />
            <Button style={{ width: "100%" }} onClick={() => goTo(Home)}>
              Cancel
            </Button>
          </>
        )) || (
          <>
            <p>Please enter your password to continue:</p>
            <Input {...passwordInput.bindings} placeholder="Password..." />
            <Spacer />
            <Button
              style={{ width: "100%" }}
              onClick={checkPassword}
              loading={loading}
            >
              Continue
            </Button>
          </>
        )}
      </div>
    </>
  );
}
