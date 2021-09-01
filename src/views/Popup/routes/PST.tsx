import React, { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowSwitchIcon,
  TrashcanIcon,
  InfoIcon,
  VerifiedIcon
} from "@primer/octicons-react";
import { goTo } from "react-chrome-extension-router";
import { Asset } from "../../../stores/reducers/assets";
import {
  Input,
  Tabs,
  useInput,
  useTabs,
  Button,
  Spacer,
  useModal,
  Modal,
  Loading,
  Progress,
  useTheme,
  Tooltip,
  useToasts
} from "@geist-ui/react";
import { useColorScheme } from "use-color-scheme";
import { useDispatch, useSelector } from "react-redux";
import { removeAsset } from "../../../stores/actions";
import { RootState } from "../../../stores/reducers";
import { JWKInterface } from "arweave/node/lib/wallet";
import { interactWrite } from "smartweave";
import { Line } from "react-chartjs-2";
import { GraphDataConfig, GraphOptions } from "../../../utils/graph";
import { AnimatePresence, motion } from "framer-motion";
import { getVerification, Threshold } from "arverify";
import manifest from "../../../../public/manifest.json";
import { browser } from "webextension-polyfill-ts";
import Arweave from "arweave";
import Verto from "@verto/lib";
import Home from "./Home";
import verto_logo_light from "../../../assets/verto_light.png";
import verto_logo_dark from "../../../assets/verto_dark.png";
import axios from "axios";
import SubPageTopStyles from "../../../styles/components/SubPageTop.module.sass";
import styles from "../../../styles/views/Popup/PST.module.sass";
import { checkPassword } from "../../../utils/auth";

export default function PST({ id, name, balance, ticker }: Asset) {
  const [price, setPrices] = useState<{ prices: number[]; dates: string[] }>(),
    { scheme } = useColorScheme(),
    tabs = useTabs("1"),
    transferInput = useInput(""),
    addressInput = useInput(""),
    [inputState, setInputState] = useState<
      "default" | "secondary" | "success" | "warning" | "error"
    >(),
    [addressInputState, setAddressInputState] = useState<
      "default" | "secondary" | "success" | "warning" | "error"
    >(),
    [loading, setLoading] = useState(false),
    dispatch = useDispatch(),
    profile = useSelector((state: RootState) => state.profile),
    removeModal = useModal(false),
    [description, setDescription] = useState(""),
    [links, setLinks] = useState<string[]>([]),
    [loadingData, setLoadingData] = useState(false),
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    wallets = useSelector((state: RootState) => state.wallets),
    geistTheme = useTheme(),
    [verified, setVerified] = useState<{
      verified: boolean;
      icon: string;
      percentage: number;
    }>(),
    [, setToast] = useToasts(),
    { arVerifyTreshold } = useSelector((state: RootState) => state.settings),
    passwordInput = useInput("");

  useEffect(() => {
    loadArPrice();
    loadData();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (tabs.state === "3")
      browser.tabs.create({ url: `https://verto.exchange/space/${id}` });
  }, [tabs, id]);

  useEffect(() => {
    checkVerification();
    // eslint-disable-next-line
  }, [addressInput.state]);

  async function loadArPrice() {
    const verto = new Verto(),
      prices = await verto.price(id);

    if (prices) setPrices(prices);
  }

  async function loadData() {
    setLoadingData(true);
    try {
      const { data } = await axios.get(`https://cache.verto.exchange/${id}`);

      if (!data) return;
      setDescription(
        data.state.settings?.find(
          (entry: any) => entry[0] === "communityDescription"
        )[1] ?? ""
      );
      setLinks([
        data.state.settings?.find(
          (entry: any) => entry[0] === "communityAppUrl"
        )[1],
        ...data.state.settings?.find(
          (entry: any) => entry[0] === "communityDiscussionLinks"
        )[1]
      ]);
    } catch {}
    setLoadingData(false);
  }

  async function transfer() {
    if (
      transferInput.state === "" ||
      Number(transferInput.state) <= 0 ||
      Number(transferInput.state) > balance
    )
      return setInputState("error");
    if (addressInput.state === "") return setAddressInputState("error");
    if (
      Number(transferInput.state) *
        (price ? price.prices[price.prices.length - 1] : 1) >
        1 &&
      !(await checkPassword(passwordInput.state))
    )
      return setToast({ text: "Invalid password", type: "error" });

    setLoading(true);

    let keyfile: JWKInterface | undefined = undefined;
    try {
      const currentWallet = wallets.find(({ address }) => address === profile);
      if (currentWallet) keyfile = JSON.parse(atob(currentWallet.keyfile));
      else throw new Error("No wallet found");
    } catch {
      return setToast({ type: "error", text: "Could not decrypt keyfile" });
    }

    if (keyfile) {
      try {
        const arweave = new Arweave(arweaveConfig);
        await interactWrite(
          // @ts-ignore
          arweave,
          keyfile,
          id,
          {
            function: "transfer",
            target: addressInput.state,
            qty: Number(transferInput.state)
          },
          [
            { name: "Type", value: "Transfer" },
            { name: "Client", value: "ArConnect" },
            { name: "Client-Version", value: manifest.version }
          ],
          addressInput.state.toString()
        );
        setToast({ type: "success", text: "The transfer is now processing" });
      } catch {
        setLoading(false);
        return setToast({ type: "error", text: "Error durring transfer" });
      }
    }
    setLoading(false);
    transferInput.setState("");
    addressInput.setState("");
    setInputState("default");
    setAddressInputState("default");
  }

  function removePst() {
    dispatch(removeAsset(profile, id));
    removeModal.setVisible(false);
    goTo(Home);
  }

  async function checkVerification() {
    if (addressInput.state === "") return setVerified(undefined);

    try {
      const verification = await getVerification(
        addressInput.state,
        arVerifyTreshold ?? Threshold.MEDIUM
      );
      setVerified(verification);
    } catch {
      setVerified(undefined);
    }
  }

  return (
    <>
      <div className={SubPageTopStyles.Head}>
        <div className={SubPageTopStyles.Back} onClick={() => goTo(Home)}>
          <ArrowLeftIcon />
        </div>
        <h1>{name}</h1>
      </div>
      <div className={styles.PST}>
        <button
          onClick={() => removeModal.setVisible(true)}
          className={styles.Remove}
        >
          <TrashcanIcon />
        </button>
        <h1 className={styles.Balance}>
          {balance.toLocaleString()} <span>{ticker}</span>
        </h1>
        <h2 className={styles.BalanceInAR}>
          {!price || price.prices.length === 0
            ? "??"
            : parseFloat(
                (balance * price.prices[price.prices.length - 1]).toFixed(4)
              )}{" "}
          AR
        </h2>
        <Tabs {...tabs.bindings} className={styles.Tabs}>
          <Tabs.Item
            label={
              <>
                <InfoIcon />
                About
              </>
            }
            value="1"
          >
            <div className={styles.About}>
              <AnimatePresence>
                {price && price.prices.length > 0 && price.dates.length > 0 && (
                  <motion.div
                    className={styles.Graph}
                    initial={{ opacity: 0, transform: "scaleY(0)" }}
                    animate={{ opacity: 1, transform: "scaleY(1)" }}
                    exit={{ opacity: 0, transform: "scaleY(0)" }}
                    transition={{ duration: 0.3 }}
                  >
                    <Line
                      data={{
                        labels: price.dates,
                        datasets: [
                          {
                            label: "AR",
                            data: price.prices.map((val) =>
                              parseFloat(val.toFixed(4))
                            ),
                            ...GraphDataConfig
                          }
                        ]
                      }}
                      options={GraphOptions({
                        tooltipText: ({ value }) => `${value} AR`
                      })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              {(loadingData && <Loading />) ||
                ((description || (links && links.length > 0)) && (
                  <>
                    <p>{description}</p>
                    <ul>
                      {links.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link}
                            onClick={() => browser.tabs.create({ url: link })}
                          >
                            {link
                              .replace(/(https|http):\/\//, "")
                              .replace(/\/$/, "")}
                          </a>
                        </li>
                      ))}
                      <li>
                        <a
                          href={`https://community.xyz/#${id}`}
                          onClick={() =>
                            browser.tabs.create({
                              url: `https://community.xyz/#${id}`
                            })
                          }
                        >
                          community.xyz/{name.toLowerCase()}
                        </a>
                      </li>
                    </ul>
                  </>
                )) || (
                  <p style={{ textAlign: "center" }}>No data for this PST.</p>
                )}
            </div>
          </Tabs.Item>
          <Tabs.Item
            label={
              <>
                <ArrowSwitchIcon />
                Transfer
              </>
            }
            value="2"
          >
            <div className={styles.Transfer}>
              <Spacer />
              <div
                className={verified && verified.verified ? styles.Address : ""}
              >
                <Input
                  {...addressInput.bindings}
                  status={addressInputState}
                  placeholder="Transfer address..."
                />
                {verified && verified.verified && (
                  <Tooltip
                    text={
                      <p style={{ margin: 0, textAlign: "center" }}>
                        Verified on <br />
                        ArVerify
                      </p>
                    }
                    placement="topEnd"
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
              <Spacer />
              <Input
                {...transferInput.bindings}
                placeholder="Transfer amount..."
                type="number"
                status={inputState}
                labelRight={ticker}
                min="0"
                max={balance}
              />
              <Spacer />
              <AnimatePresence>
                {Number(transferInput.state) *
                  (price ? price.prices[price.prices.length - 1] : 1) >
                  1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.23, ease: "easeInOut" }}
                  >
                    <Input.Password
                      {...passwordInput.bindings}
                      placeholder="Enter your password..."
                    />
                    <Spacer />
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                style={{ width: "100%" }}
                onClick={transfer}
                loading={loading}
              >
                Transfer
              </Button>
            </div>
          </Tabs.Item>
          <Tabs.Item
            label={
              <>
                <img
                  src={scheme === "dark" ? verto_logo_dark : verto_logo_light}
                  alt="verto"
                  className={styles.TabItemIcon}
                />
                Verto
              </>
            }
            value="3"
          ></Tabs.Item>
        </Tabs>
      </div>
      <Modal {...removeModal.bindings}>
        <Modal.Title>Remove PST?</Modal.Title>
        <Modal.Content>
          <p>Do you want to remove this PST from the displayed PSTs list?</p>
        </Modal.Content>
        <Modal.Action passive onClick={() => removeModal.setVisible(false)}>
          Cancel
        </Modal.Action>
        <Modal.Action onClick={removePst}>Remove</Modal.Action>
      </Modal>
    </>
  );
}
