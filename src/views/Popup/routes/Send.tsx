import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import {
  Spacer,
  useInput,
  useToasts,
  Progress,
  useTheme
} from "@geist-ui/react";
import { VerifiedIcon, FileSubmoduleIcon } from "@primer/octicons-react";
import { Button, Input, Select } from "@verto/ui";
import { JWKInterface } from "arweave/node/lib/wallet";
import { arToFiat, getSymbol } from "../../../utils/currency";
import { Threshold, getVerification } from "arverify";
import { AnimatePresence, motion } from "framer-motion";
import { checkPassword } from "../../../utils/auth";
import manifest from "../../../../public/manifest.json";
import WalletManager from "../../../components/WalletManager";
import Arweave from "arweave";
import axios from "axios";
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
    [arPriceFiat, setArPriceFiat] = useState(1),
    [verified, setVerified] = useState<{
      verified: boolean;
      icon: string;
      percentage: number;
    }>(),
    { arVerifyTreshold } = useSelector((state: RootState) => state.settings),
    geistTheme = useTheme(),
    passwordInput = useInput("");
  let { currency, feeMultiplier } = useSelector(
    (state: RootState) => state.settings
  );

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
      if (
        feeMultiplier < 1 ||
        feeMultiplier === undefined ||
        feeMultiplier === null
      )
        feeMultiplier = 1;
      setFee(
        arweave.ar.winstonToAr(
          (parseFloat(data as string) * feeMultiplier).toFixed(0)
        )
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

        transaction.reward = (parseFloat(cost) * feeMultiplier).toFixed(0);
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

  const DisplayVerifiedIcon = () => (
    <>
      {verified && verified?.verified ? (
        <VerifiedIcon />
      ) : (
        <FileSubmoduleIcon size={30} />
      )}
    </>
  );

  const DisplayAR = () => (
    <Select filled small>
      <option value="AR">AR</option>
      <option value="BTC">BTC</option>
      <option value="VRT">VRT</option>
      <option value="ETH">ETH</option>
      <option value="USDT">USDT</option>
    </Select>
  );

  return (
    <>
      <WalletManager pageTitle="Send" />
      <div className={styles.View}>
        <div
          className={
            verified && verified.verified
              ? styles.Amount + " " + styles.Target
              : ""
          }
        >
          <Input
            small
            {...targetInput.bindings}
            style={{ width: "98%" }}
            inlineLabel={<DisplayVerifiedIcon />}
            label="TARGET"
            placeholder="Address..."
            status={submitted && targetInput.state === "" ? "error" : undefined}
          />
        </div>
        <AnimatePresence>
          {verified && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p
                style={{
                  marginTop: "2em",
                  marginBottom: ".4em",
                  fontWeight: "500",
                  color: "#666",
                  fontSize: ".9em"
                }}
              >
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
        <Spacer h={verified ? 0.55 : 1} />
        <div className={styles.Amount}>
          <Input
            small
            {...amountInput.bindings}
            style={{ width: "98%" }}
            placeholder="000.000"
            label="QUANTITY"
            inlineLabel={<DisplayAR />}
            type="number"
            min="0"
            status={
              submitted &&
              (amountInput.state === "" ||
                Number(amountInput.state) > Number(balance))
                ? "error"
                : undefined
            }
          />
        </div>
        <p className={styles.InputInfo}>
          <span>
            {"~" + getSymbol(currency)}
            {(arPriceFiat * Number(amountInput.state)).toFixed(2)}
            {" " + currency}
          </span>
          <span>1 AR = {getSymbol(currency) + arPriceFiat.toFixed(2)}</span>
          {/* TODO: Update to display price according to selected token */}
        </p>
        <label className={styles.MessageLabel}>
          message (optional)
          <textarea
            {...messageInput.bindings}
            className={styles.MessageInput}
            placeholder="This is a test ..."
          ></textarea>
        </label>

        <div className={styles.FeeContainer}>
          <p className={styles.FeeDisplay}>Arweave fee: {fee} AR</p>
          <p className={styles.FeeDisplay}>Total: {fee} AR</p>
        </div>

        <AnimatePresence>
          {Number(amountInput.state) > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.23, ease: "easeInOut" }}
            >
              <Input
                small
                {...passwordInput.bindings}
                type="password"
                label="ENTER PASSWORD"
                style={{ width: "98%", marginBottom: "1em" }}
                placeholder="Enter your password..."
                status={
                  submitted && passwordInput.state === "" ? "error" : undefined
                }
              />
              <Spacer h={1} />
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          small
          style={{ width: "84%" }}
          type="filled"
          onClick={send}
          loading={loading}
        >
          Send
        </Button>
        <Spacer />
      </div>
    </>
  );
}
