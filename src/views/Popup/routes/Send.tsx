import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import {
  // useToasts,
  Progress,
  useTheme
} from "@geist-ui/react";
import { VerifiedIcon, FileSubmoduleIcon } from "@primer/octicons-react";
import { Button, Input, Select, Spacer, useInput, useToasts } from "@verto/ui";
import { JWKInterface } from "arweave/node/lib/wallet";
import { arToFiat, getSymbol } from "../../../utils/currency";
import { Threshold, getVerification } from "arverify";
import { AnimatePresence, motion } from "framer-motion";
import { checkPassword } from "../../../utils/auth";
import { concatGatewayURL } from "../../../utils/gateways";
import { updateSettings } from "../../../stores/actions";
import manifest from "../../../../public/manifest.json";
import WalletManager from "../../../components/WalletManager";
import Arweave from "arweave";
import axios from "axios";
import styles from "../../../styles/views/Popup/send.module.sass";

export default function Send() {
  const targetInput = useInput(""),
    amountInput = useInput<number>(0),
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
    { setToast } = useToasts(),
    [arPriceFiat, setArPriceFiat] = useState(1),
    [verified, setVerified] = useState<{
      verified: boolean;
      icon: string;
      percentage: number;
    }>(),
    { arVerifyTreshold } = useSelector((state: RootState) => state.settings),
    geistTheme = useTheme(),
    passwordInput = useInput("");

  const { currency, feeMultiplier } = useSelector(
    (state: RootState) => state.settings
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBalance();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    calculateFee();
    checkVerification();
    // eslint-disable-next-line
  }, [targetInput.state, message, profile]);

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

  const dispatch = useDispatch();

  async function calculateFee() {
    try {
      const messageSize = new TextEncoder().encode(message).length,
        { data } = await axios.get(
          `${concatGatewayURL(arweaveConfig)}/price/${messageSize}/${
            targetInput.state
          }`
        );

      if (feeMultiplier < 1 || !feeMultiplier) {
        dispatch(updateSettings({ feeMultiplier: 1 }));
      }

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
      amountInput.state === 0 ||
      Number(amountInput.state) > Number(balance) ||
      currentWallet === undefined
    )
      return;

    // ask for password if sending more than 1 AR
    if (
      Number(amountInput.state) > 1 &&
      !(await checkPassword(passwordInput.state))
    )
      return setToast({
        description: "Invalid password",
        type: "error",
        duration: 2000
      });

    setLoading(true);

    try {
      const keyfile: JWKInterface = JSON.parse(atob(currentWallet)),
        transaction = await arweave.createTransaction(
          {
            target: targetInput.state,
            quantity: arweave.ar.arToWinston(amountInput.state.toString()),
            data: message !== "" ? message : undefined
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
        setToast({
          description: "Sent transaction",
          type: "success",
          duration: 2000
        });
      else throw new Error("");

      targetInput.setState("");
      amountInput.setState(0);

      setMessage("");
      setSubmitted(false);
    } catch {
      setToast({
        description: "Error sending transaction",
        type: "error",
        duration: 2000
      });
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
      <WalletManager pageTitle="Send" />
      <div className={styles.View}>
        <p className={styles.Label}>Target</p>
        <Input
          small
          {...targetInput.bindings}
          inlineLabel={(verified && <VerifiedIcon />) || undefined}
          placeholder="Address..."
          fullWidth
          status={submitted && targetInput.state === "" ? "error" : undefined}
        />
        <AnimatePresence>
          {verified && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Spacer y={1} />
              <p className={styles.InputInfo}>
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
        <p className={styles.Label}>Quantity</p>
        <Input
          small
          {...amountInput.bindings}
          fullWidth
          placeholder="000.000"
          inlineLabel={
            <Select filled small className={styles.TokenSelect}>
              <option value="AR">AR</option>
              <option value="VRT">VRT</option>
              <option value="ARDRIVE">ARDRIVE</option>
            </Select>
          }
          type="number"
          min={0}
          status={
            submitted &&
            (amountInput.state === 0 ||
              Number(amountInput.state) > Number(balance))
              ? "error"
              : undefined
          }
        />
        <p className={styles.InputInfo}>
          <span>
            {"~" + getSymbol(currency)}
            {(arPriceFiat * Number(amountInput.state)).toFixed(2)}
            {" " + currency}
          </span>
          <span>1 AR = {getSymbol(currency) + arPriceFiat.toFixed(2)}</span>
          {/* TODO: Update to display price according to selected token */}
        </p>
        <p className={styles.Label}>Message (optional)</p>
        <textarea
          className={styles.MessageInput}
          placeholder="Enter message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
        <Spacer y={0.2} />
        <p className={styles.FeeDisplay}>Arweave fee: {fee} AR</p>
        <p className={styles.FeeDisplay}>Total: {fee} AR</p>
        <Spacer y={1} />
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
              <Spacer y={1} />
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          small
          style={{ width: "86%" }}
          type="filled"
          onClick={send}
          loading={loading}
          className={styles.Button}
        >
          Send
        </Button>
        <Spacer />
      </div>
    </>
  );
}
