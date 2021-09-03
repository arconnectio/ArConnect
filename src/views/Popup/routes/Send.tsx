import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import {
  Button,
  Input,
  Spacer,
  useInput,
  useToasts,
  Tooltip,
  Progress,
  useTheme
} from "@geist-ui/react";
import { goTo } from "react-chrome-extension-router";
import { JWKInterface } from "arweave/node/lib/wallet";
import { QuestionIcon, VerifiedIcon } from "@primer/octicons-react";
import { arToFiat, getSymbol } from "../../../utils/currency";
import { Threshold, getVerification } from "arverify";
import { AnimatePresence, motion } from "framer-motion";
import { checkPassword } from "../../../utils/auth";
import manifest from "../../../../public/manifest.json";
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
    { currency, feeMultiplier } = useSelector(
      (state: RootState) => state.settings
    ),
    [arPriceFiat, setArPriceFiat] = useState(1),
    [verified, setVerified] = useState<{
      verified: boolean;
      icon: string;
      percentage: number;
    }>(),
    { arVerifyTreshold } = useSelector((state: RootState) => state.settings),
    geistTheme = useTheme(),
    passwordInput = useInput("");

  useEffect(() => {
    loadBalance();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    calculateFee();
    checkVerification();
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
      setFee(
        arweave.ar.winstonToAr((parseFloat(data) * feeMultiplier).toString())
      );
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

    // ask for password if sending more than 1 AR
    if (
      Number(amountInput.state) > 1 &&
      !(await checkPassword(passwordInput.state))
    )
      return setToast({ text: "Invalid password", type: "error" });

    setLoading(true);

    try {
      const keyfile: JWKInterface = JSON.parse(atob(currentWallet)),
        transaction = await arweave.createTransaction(
          {
            target: targetInput.state,
            quantity: arweave.ar.arToWinston(amountInput.state),
            data: messageInput.state !== "" ? messageInput.state : undefined
          },
          keyfile
        );

      // fee multiplying
      if (feeMultiplier > 1) {
        const cost = await arweave.transactions.getPrice(
          parseFloat(transaction.data_size),
          targetInput.state
        );

        transaction.reward = (parseFloat(cost) * feeMultiplier).toString();
      }

      transaction.addTag("App-Name", "ArConnect");
      transaction.addTag("App-Version", manifest.version);
      transaction.addTag("Content-Type", "text/plain");

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

  async function checkVerification() {
    if (targetInput.state === "") return setVerified(undefined);

    try {
      const verification = await getVerification(
        targetInput.state,
        arVerifyTreshold ?? Threshold.MEDIUM
      );
      setVerified(verification);
    } catch {
      setVerified(undefined);
    }
  }

  return (
    <>
      <WalletManager />
      <div className={styles.View}>
        <div
          className={
            verified && verified.verified
              ? styles.Amount + " " + styles.Target
              : ""
          }
        >
          <Input
            {...targetInput.bindings}
            placeholder="Send to address..."
            status={submitted && targetInput.state === "" ? "error" : "default"}
          />
          {verified && verified.verified && (
            <Tooltip
              text={
                <p style={{ margin: 0, textAlign: "center" }}>
                  Verified on <br />
                  ArVerify
                </p>
              }
              placement="bottomEnd"
            >
              <VerifiedIcon />
            </Tooltip>
          )}
        </div>
        <AnimatePresence>
          {verified && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p style={{ margin: 0, marginBottom: ".21em" }}>
                Trust score: {verified.percentage?.toFixed(2) ?? 0}%
              </p>
              <Progress
                value={verified.percentage}
                colors={{
                  30: geistTheme.palette.error,
                  80: geistTheme.palette.warning,
                  100: "#99C507"
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <Spacer y={verified ? 0.55 : 1} />
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
                (parseFloat(balance) - parseFloat(fee)).toString()
              )
            }
          >
            Max
          </Button>
        </div>
        <Spacer y={0.19} />
        <p className={styles.InputInfo}>
          <span>
            {"~" + getSymbol(currency)}
            {(arPriceFiat * Number(amountInput.state)).toFixed(2)}
            {" " + currency}
          </span>
          <span>1 AR = {getSymbol(currency) + arPriceFiat.toFixed(2)}</span>
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
        <AnimatePresence>
          {Number(amountInput.state) > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.23, ease: "easeInOut" }}
            >
              <Input.Password
                {...passwordInput.bindings}
                width="100%"
                placeholder="Enter your password..."
                status={
                  submitted && passwordInput.state === "" ? "error" : "default"
                }
              />
              <Spacer y={1} />
            </motion.div>
          )}
        </AnimatePresence>
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
