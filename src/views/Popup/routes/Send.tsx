import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import {
  Button,
  Input,
  Spacer,
  useInput,
  useToasts,
  Tooltip
} from "@geist-ui/react";
import { goTo } from "react-chrome-extension-router";
import { JWKInterface } from "arweave/node/lib/wallet";
import { QuestionIcon } from "@primer/octicons-react";
import { arToFiat, getSymbol } from "../../../utils/currency";
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
    currentWallet = useSelector((state: RootState) => state.wallets).find(
      ({ address }) => address === profile
    )?.keyfile,
    [balance, setBalance] = useState("0"),
    [submitted, setSubmitted] = useState(false),
    [loading, setLoading] = useState(false),
    [, setToast] = useToasts(),
    { currency } = useSelector((state: RootState) => state.settings),
    [arPriceFiat, setArPriceFiat] = useState(1);

  useEffect(() => {
    loadBalance();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    calculateFee();
    // eslint-disable-next-line
  }, [targetInput.state, messageInput.state, profile]);

  useEffect(() => {
    calculateArPriceInCurrency();
    // eslint-disable-next-line
  }, [currency]);

  async function calculateArPriceInCurrency() {
    setArPriceFiat(await arToFiat(1, currency));
  }

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
      Number(amountInput.state) > Number(balance) ||
      currentWallet === undefined
    )
      return;
    setLoading(true);

    try {
      const keyfile: JWKInterface = JSON.parse(atob(currentWallet)),
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

      transaction.addTag("App-Name", "ArConnect");
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
            onClick={() =>
              amountInput.setState((Number(balance) - Number(fee)).toString())
            }
          >
            Max
          </Button>
        </div>
        <Spacer y={0.19} />
        <p className={styles.InputInfo}>
          <span>
            {"~" + getSymbol(currency)}
            {arPriceFiat * Number(amountInput.state)}
            {" " + currency}
          </span>
          <span>1 AR = {getSymbol(currency) + arPriceFiat.toString()}</span>
        </p>
        <Spacer y={0.45} />
        <Input {...messageInput.bindings} placeholder="Message (optional)" />
        <p className={styles.FeeDisplay}>
          Arweave fee: {fee} AR
          <Tooltip
            text={
              <p style={{ textAlign: "center", margin: "0" }}>
                Fee charged by the <br />
                Arweave network
              </p>
            }
            style={{ marginLeft: ".18em" }}
          >
            <QuestionIcon size={24} />
          </Tooltip>
        </p>
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
