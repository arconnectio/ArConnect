import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import { Button, Input, Spacer, useInput, useToasts } from "@geist-ui/react";
import { goTo } from "react-chrome-extension-router";
import Home from "./Home";
import Arweave from "arweave";
import axios from "axios";
import WalletManager from "../../../components/WalletManager";
import styles from "../../../styles/views/Popup/send.module.sass";

export default function Send() {
  const targetInput = useInput(""),
    amountInput = useInput("0"),
    messageInput = useInput(""),
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    arweave = new Arweave(arweaveConfig),
    [fee, setFee] = useState("0"),
    profile = useSelector((state: RootState) => state.profile),
    [balance, setBalance] = useState("0"),
    [submitted, setSubmitted] = useState(false),
    [loading, setLoading] = useState(false),
    [, setToast] = useToasts();

  useEffect(() => {
    loadBalance();
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

  async function send() {
    setSubmitted(true);
    if (
      targetInput.state === "" ||
      amountInput.state === "" ||
      Number(amountInput.state) > Number(balance)
    )
      return;
    setLoading(true);
    try {
      // TODO: send transaction
      setToast({ text: "Sent transaction", type: "success" });
    } catch {
      setToast({ text: "Error sending transaction", type: "error" });
    }
    setLoading(false);
  }

  return (
    <>
      <WalletManager />
      <div className={styles.View}>
        <Input
          {...targetInput.bindings}
          placeholder="Send to address..."
          status={submitted && targetInput.state === "" ? "error" : "default"}
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
            onClick={() => amountInput.setState(balance)}
          >
            Max
          </Button>
        </div>
        <Spacer />
        <Input {...messageInput.bindings} placeholder="Message (optional)" />
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
      </div>
    </>
  );
}
