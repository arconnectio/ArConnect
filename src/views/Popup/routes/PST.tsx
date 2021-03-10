import React, { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowSwitchIcon,
  TrashcanIcon,
  InfoIcon
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
  Loading
} from "@geist-ui/react";
import { useColorScheme } from "use-color-scheme";
import { useDispatch, useSelector } from "react-redux";
import { removeAsset } from "../../../stores/actions";
import { RootState } from "../../../stores/reducers";
import { JWKInterface } from "arweave/node/lib/wallet";
import { interactWrite } from "smartweave";
import { Line } from "react-chartjs-2";
import { GraphDataConfig, GraphOptions } from "../../../utils/graph";
import Arweave from "arweave";
import Verto from "@verto/lib";
import Home from "./Home";
import verto_logo_light from "../../../assets/verto_light.png";
import verto_logo_dark from "../../../assets/verto_dark.png";
import axios from "axios";
import SubPageTopStyles from "../../../styles/components/SubPageTop.module.sass";
import styles from "../../../styles/views/Popup/PST.module.sass";

export default function PST({ id, name, balance, ticker }: Asset) {
  const [price, setPrices] = useState<{ prices: number[]; dates: string[] }>(),
    { scheme } = useColorScheme(),
    tabs = useTabs("1"),
    transferInput = useInput(""),
    addressInput = useInput(""),
    passwordInput = useInput(""),
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
    [showPasswordInput, setShowPasswordInput] = useState(false),
    [description, setDescription] = useState(""),
    [links, setLinks] = useState<string[]>([]),
    [loadingData, setLoadingData] = useState(false),
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    wallets = useSelector((state: RootState) => state.wallets);

  useEffect(() => {
    loadArPrice();
    loadData();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (tabs.state === "3")
      window.open(`https://verto.exchange/token?id=${id}`);
  }, [tabs, id]);

  async function loadArPrice() {
    const verto = new Verto(),
      prices = await verto.price(id);

    if (prices) setPrices(prices);
  }

  async function loadData() {
    setLoadingData(true);
    try {
      const { data } = await axios.get(
          "https://community.xyz/caching/communities"
        ),
        community = data.find((psc: any) => psc.id === id);

      if (!community) return;
      setDescription(community.state.settings?.communityDescription ?? "");
      setLinks([
        community.state.settings?.communityAppUrl,
        ...community.state.settings?.communityDiscussionLinks
      ]);
    } catch {}
    setLoadingData(false);
  }

  function forwardToPassword() {
    if (
      transferInput.state === "" ||
      Number(transferInput.state) <= 0 ||
      Number(transferInput.state) > balance
    )
      return setInputState("error");
    if (addressInput.state === "") return setAddressInputState("error");

    setShowPasswordInput(true);
    setInputState("default");
    setAddressInputState("default");
  }

  async function transfer() {
    setLoading(true);
    if (passwordInput.state === "") return setInputState("error");

    let keyfile: JWKInterface | undefined = undefined;
    try {
      const currentWallet = wallets.find(({ address }) => address === profile);
      if (currentWallet) {
        const decodedKeyfile = atob(JSON.parse(currentWallet.keyfile));
        keyfile = JSON.parse(decodedKeyfile);
      } else setInputState("error");
    } catch {
      setInputState("error");
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
            { name: "Exchange", value: "Verto" },
            { name: "Type", value: "Transfer" }
          ],
          addressInput.state.toString()
        );
      } catch {}
    }
    setLoading(false);
    setShowPasswordInput(false);
    transferInput.setState("");
    addressInput.setState("");
    passwordInput.setState("");
  }

  function removePst() {
    dispatch(removeAsset(profile, id));
    removeModal.setVisible(false);
    goTo(Home);
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
            : balance * price.prices[price.prices.length - 1]}{" "}
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
              {((loadingData || !price) && <Loading />) ||
                ((description || (links && links.length > 0)) && (
                  <>
                    {price &&
                      price.prices.length > 0 &&
                      price.dates.length > 0 && (
                        <div className={styles.Graph}>
                          <Line
                            data={{
                              labels: price.dates,
                              datasets: [
                                {
                                  label: "AR",
                                  data: price.prices.map((val) => val),
                                  ...GraphDataConfig
                                }
                              ]
                            }}
                            options={GraphOptions({
                              tooltipText: ({ value }) => `${value} AR`
                            })}
                          />
                        </div>
                      )}
                    <p>{description}</p>
                    <ul>
                      {links.map((link, i) => (
                        <li key={i}>
                          <a href={link} onClick={() => window.open(link)}>
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
                            window.open(`https://community.xyz/#${id}`)
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
              {(!showPasswordInput && (
                <>
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
                  <Input
                    {...addressInput.bindings}
                    status={addressInputState}
                    placeholder="Transfer address..."
                  />
                  <Spacer />
                  <Button style={{ width: "100%" }} onClick={forwardToPassword}>
                    Transfer
                  </Button>
                </>
              )) || (
                <>
                  <Input
                    {...passwordInput.bindings}
                    placeholder="Password..."
                    status={inputState}
                    type="password"
                  />
                  <Spacer />
                  <Button
                    style={{ width: "100%" }}
                    onClick={transfer}
                    loading={loading}
                  >
                    Transfer
                  </Button>
                </>
              )}
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
