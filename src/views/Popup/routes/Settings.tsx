import React, { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  XIcon
} from "@primer/octicons-react";
import {
  Button,
  Input,
  Modal,
  Radio,
  Spacer,
  Toggle,
  useInput,
  useModal,
  useToasts
} from "@geist-ui/react";
import { goTo } from "react-chrome-extension-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import { formatAddress, getRealURL, shortenURL } from "../../../utils/url";
import { Currency } from "../../../stores/reducers/settings";
import { Threshold } from "arverify";
import { MessageType } from "../../../utils/messenger";
import { updateIcon } from "../../../background/icon";
import { checkPassword, setPassword } from "../../../utils/auth";
import { browser } from "webextension-polyfill-ts";
import {
  removePermissions,
  updateArweaveConfig,
  updateSettings,
  removeAllowance,
  resetArweaveConfig
} from "../../../stores/actions";
import CryptoES from "crypto-es";
import dayjs from "dayjs";
import Home from "./Home";
import Arweave from "arweave";
import SubPageTopStyles from "../../../styles/components/SubPageTop.module.sass";
import styles from "../../../styles/views/Popup/settings.module.sass";

export default function Settings() {
  const [setting, setCurrSetting] = useState<
      | "events" // change to apps
      | "permissions"
      | "currency"
      | "arweave"
      | "arverify"
      | "password"
      | "config_file"
      | "fee"
    >(),
    permissions = useSelector((state: RootState) => state.permissions),
    [opened, setOpened] = useState<{ url: string; opened: boolean }[]>([]),
    dispatch = useDispatch(),
    addURLInput = useInput(""),
    [events, setEvents] = useState<ArConnectEvent[]>([]),
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    otherSettings = useSelector((state: RootState) => state.settings),
    arweaveHostInput = useInput(arweaveConfig.host),
    arweavePortInput = useInput(arweaveConfig.port.toString()),
    arweaveProtocolInput = useInput(arweaveConfig.protocol),
    [arweave, setArweave] = useState<Arweave>(new Arweave(arweaveConfig)),
    passwords = {
      new: useInput(""),
      newAgain: useInput(""),
      old: useInput("")
    },
    [, setToast] = useToasts(),
    configFileModal = useModal(),
    configPasswordInput = useInput(""),
    [generatingConfig, setGeneratingConfig] = useState(false),
    feeMultiplier = useInput((otherSettings?.feeMultiplier || 1).toString()),
    wallets = useSelector((state: RootState) => state.wallets),
    [downloadWallet, setDownloadWallet] = useState<string>();

  useEffect(() => {
    setOpened(permissions.map(({ url }) => ({ url, opened: false })));
    loadEvents();

    if (!otherSettings?.feeMultiplier)
      dispatch(updateSettings({ feeMultiplier: 1 }));
    // eslint-disable-next-line
  }, []);

  // update instance on config changes
  useEffect(() => setArweave(new Arweave(arweaveConfig)), [arweaveConfig]);

  function open(url: string) {
    setOpened((val) => [
      ...val.filter((permissionGround) => permissionGround.url !== url),
      { url, opened: !isOpened(url) }
    ]);
  }

  function isOpened(url: string) {
    return (
      opened.find((permissionGround) => permissionGround.url === url)?.opened ??
      false
    );
  }

  function filterWithPermission() {
    return permissions.filter(
      (permissionGroup) => permissionGroup.permissions.length > 0
    );
  }

  function loadEvents() {
    const evs = localStorage.getItem("arweave_events");
    if (!evs) return;
    setEvents(
      (JSON.parse(evs).val as ArConnectEvent[]).sort((a, b) => b.date - a.date)
    );
  }

  function updateConfig() {
    if (
      arweaveProtocolInput.state === "" ||
      arweavePortInput.state === "" ||
      arweaveHostInput.state === ""
    )
      return;
    dispatch(
      updateArweaveConfig({
        host: arweaveHostInput.state,
        port: Number(arweavePortInput.state),
        protocol: arweaveProtocolInput.state as "http" | "https"
      })
    );
    setCurrSetting(undefined);
  }

  async function updatePassword() {
    if (
      passwords.new.state === "" ||
      passwords.newAgain.state === "" ||
      passwords.old.state === ""
    ) {
      setToast({ text: "Please fill all password fields", type: "error" });
      return;
    }
    if (passwords.new.state !== passwords.newAgain.state) {
      setToast({
        text: "The two new passwords are not the same",
        type: "error"
      });
      return;
    }
    if (passwords.new.state.length < 5) {
      setToast({ text: "Weak password", type: "error" });
      return;
    }

    try {
      const res = await checkPassword(passwords.old.state);
      if (!res)
        return setToast({ text: "Old password is wrong", type: "error" });

      if (passwords.old.state === passwords.new.state)
        return setToast({
          text: "You are already using this password",
          type: "error"
        });

      await setPassword(passwords.new.state);
      setToast({ text: "Updated password", type: "success" });
      clearInputs();
    } catch {
      setToast({ text: "Error while updating password", type: "error" });
    }
  }

  function clearInputs() {
    passwords.new.reset();
    passwords.newAgain.reset();
    passwords.old.reset();
    addURLInput.reset();
    arweaveHostInput.reset();
    arweavePortInput.reset();
    arweaveProtocolInput.reset();
  }

  async function generateConfigFile() {
    const password = configPasswordInput.state;
    const storedData = (await browser.storage.local.get("persist:root"))?.[
      "persist:root"
    ];

    if (!storedData || storedData === "")
      return setToast({ text: "Could not get stored data", type: "error" });

    const encrypted = CryptoES.AES.encrypt(storedData, password);

    // create element that downloads the virtual file
    const el = document.createElement("a");

    el.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(
        encrypted.toString()
      )}`
    );
    el.setAttribute(
      "download",
      `arconnect-config-${dayjs().format("YYYY-MM-DD")}.txt`
    );
    el.style.display = "none";

    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);

    setToast({ text: "Created config", type: "success" });
    configFileModal.setVisible(false);
  }

  function updateFeeMultiplier() {
    try {
      if (
        feeMultiplier.state === "" ||
        isNaN(parseFloat(feeMultiplier.state)) ||
        parseFloat(feeMultiplier.state) < 1
      )
        return;
      dispatch(
        updateSettings({ feeMultiplier: parseFloat(feeMultiplier.state) })
      );
      setCurrSetting(undefined);
    } catch {}
  }

  async function downloadSelectedWallet() {
    const el = document.createElement("a");
    const walletJWK = wallets.find(
      ({ address }) => address === downloadWallet
    )?.keyfile;

    if (!walletJWK)
      return setToast({
        text: "Error finding keyfile",
        type: "error",
        delay: 2000
      });

    el.setAttribute(
      "href",
      `data:application/json;charset=utf-8,${encodeURIComponent(
        atob(walletJWK)
      )}`
    );
    el.setAttribute("download", `arweave-keyfile-${downloadWallet}.json`);
    el.style.display = "none";

    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);

    setToast({ text: "Downloaded keyfile", type: "success", delay: 3000 });
    configFileModal.setVisible(false);
  }

  const SettingsItem = ({
    header,
    headerText,
    currSetting,
    confettiEffect
  }: SettingsItemProps) => (
    <div className={styles.Setting} onClick={() => setCurrSetting(currSetting)}>
      <div>
        <h1>{header}</h1>
        <p>{headerText}</p>
      </div>
      <div className={styles.Arrow}>
        {confettiEffect ? (
          <Toggle
            checked={otherSettings.arConfetti}
            onChange={() =>
              dispatch(
                updateSettings({ arConfetti: !otherSettings.arConfetti })
              )
            }
          />
        ) : (
          <ChevronRightIcon size={18} />
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={SubPageTopStyles.Head}>
        <div
          className={SubPageTopStyles.Back}
          onClick={() => {
            if (setting) {
              setCurrSetting(undefined);
              clearInputs();
            } else goTo(Home);
          }}
        >
          <ArrowLeftIcon />
        </div>
        <h1>
          {(setting === "events" && "Events") ||
            (setting === "permissions" && "Permissions") ||
            (setting === "password" && "Password") ||
            (setting === "currency" && "Currency") ||
            (setting === "arweave" && "Arweave Config") ||
            (setting === "arverify" && "ArVerify Config") ||
            (setting === "config_file" && "Download Config") ||
            (setting === "fee" && "Fee multiplier") ||
            "Settings"}
        </h1>
      </div>
      <div className={styles.Settings}>
        {(!setting && (
          <>
            <SettingsItem
              header="Apps"
              currSetting="events"
              headerText="View settings for connected dApps"
            />

            <SettingsItem
              header="Password"
              currSetting="password"
              headerText="Update your password"
            />

            <SettingsItem
              header="Fee multiplier"
              currSetting="fee"
              headerText="Change default fee multiplier"
            />

            <SettingsItem
              header="Currency"
              currSetting="currency"
              headerText="Set your local currency"
            />

            <SettingsItem
              header="Arweave Config"
              currSetting="arweave"
              headerText="Update Arweave gateway config"
            />

            <SettingsItem
              header="ArVerify Config"
              currSetting="arverify"
              headerText="Set the verification threshold"
            />

            <SettingsItem
              header="Confetti effect"
              currSetting="arweave"
              headerText="Show confetti animation on transaction signing"
              confettiEffect
            />

            <SettingsItem
              header="Download config"
              currSetting="config_file"
              headerText="Generate an ArConnect config file"
            />
          </>
        )) ||
          (setting === "permissions" && (
            <>
              {(filterWithPermission().length > 0 &&
                filterWithPermission()
                  .sort((a, b) => {
                    if (a.url < b.url) return -1;
                    if (a.url > b.url) return 1;
                    return 0;
                  })
                  .map((permissionGroup, i) => (
                    <div key={i}>
                      <div
                        className={styles.Setting + " " + styles.SubSetting}
                        onClick={() => open(permissionGroup.url)}
                      >
                        <h1 title={permissionGroup.url}>
                          {shortenURL(permissionGroup.url)}
                        </h1>
                        <div className={styles.Arrow}>
                          {(isOpened(permissionGroup.url) && (
                            <ChevronDownIcon />
                          )) || <ChevronRightIcon />}
                        </div>
                      </div>
                      {isOpened(permissionGroup.url) && (
                        <div className={styles.OptionContent}>
                          {permissionGroup.permissions.map((perm, j) => (
                            <h1 key={j}>
                              {perm}
                              <div
                                className={styles.RemoveOption}
                                onClick={() => {
                                  dispatch(
                                    removePermissions(permissionGroup.url, [
                                      perm
                                    ])
                                  );
                                  if (
                                    permissionGroup.permissions.filter(
                                      (val) => val !== perm
                                    ).length === 0
                                  ) {
                                    dispatch(
                                      removeAllowance(permissionGroup.url)
                                    );
                                    updateIcon(false);
                                  }
                                }}
                              >
                                <XIcon />
                              </div>
                            </h1>
                          ))}
                        </div>
                      )}
                    </div>
                  ))) || <p>No permissions...</p>}
            </>
          )) ||
          (setting === "currency" && (
            <div className={styles.OptionContent}>
              <Radio.Group
                value={otherSettings.currency}
                onChange={(val) =>
                  dispatch(updateSettings({ currency: val as Currency }))
                }
                className={styles.Radio}
              >
                <Radio value="USD">
                  USD
                  <Radio.Description>United States Dollar</Radio.Description>
                </Radio>
                <Radio value="EUR">
                  EUR
                  <Radio.Description>Euro</Radio.Description>
                </Radio>
                <Radio value="GBP">
                  GBP
                  <Radio.Description>Pound Sterling</Radio.Description>
                </Radio>
              </Radio.Group>
            </div>
          )) ||
          (setting === "events" && (
            <>
              {events.length > 0 && (
                <div
                  className={styles.Setting + " " + styles.SubSetting}
                  onClick={() => {
                    localStorage.setItem(
                      "arweave_events",
                      JSON.stringify({ val: [] })
                    );
                    setEvents([]);
                  }}
                >
                  <h1>Clear events...</h1>
                </div>
              )}
              {(events.length > 0 &&
                events.map((event, i) => (
                  <div
                    className={
                      styles.Setting +
                      " " +
                      styles.SubSetting +
                      " " +
                      styles.EventItem
                    }
                    key={i}
                  >
                    <h1>
                      {event.event}
                      <span className={styles.EventDate}>
                        {new Intl.DateTimeFormat(navigator.language, {
                          // @ts-ignore
                          timeStyle: "medium",
                          dateStyle: "short"
                        }).format(event.date)}
                      </span>
                    </h1>
                    <p title={getRealURL(event.url)}>
                      {shortenURL(getRealURL(event.url))}
                    </p>
                  </div>
                ))) || <p>No events</p>}
            </>
          )) ||
          (setting === "arweave" && (
            <div className={styles.OptionContent}>
              <Spacer />
              <Input
                {...arweaveHostInput.bindings}
                placeholder="Host..."
                type={arweaveHostInput.state === "" ? "error" : "default"}
              />
              <Spacer />
              <Input
                {...arweavePortInput.bindings}
                placeholder="Port..."
                htmlType="number"
                type={arweavePortInput.state === "" ? "error" : "default"}
              />
              <Spacer />
              <Input
                {...arweaveProtocolInput.bindings}
                placeholder="Protocol..."
                type={arweaveProtocolInput.state === "" ? "error" : "default"}
              />
              <Spacer />
              <Button
                style={{ width: "100%", marginTop: ".5em" }}
                onClick={updateConfig}
              >
                Set config
              </Button>
              <Spacer />
              <Button
                style={{ width: "100%", marginTop: ".5em" }}
                onClick={() => {
                  dispatch(resetArweaveConfig());
                  setCurrSetting(undefined);
                }}
              >
                Reset
              </Button>
            </div>
          )) ||
          (setting === "arverify" && (
            <div className={styles.OptionContent}>
              <h1>Threshold:</h1>
              <Radio.Group
                value={otherSettings.arVerifyTreshold}
                onChange={(val) =>
                  dispatch(
                    updateSettings({ arVerifyTreshold: val as Threshold })
                  )
                }
                className={styles.Radio}
              >
                <Radio value={Threshold.LOW}>
                  Low
                  <Radio.Description>{Threshold.LOW * 100}%</Radio.Description>
                </Radio>
                <Radio value={Threshold.MEDIUM}>
                  Medium
                  <Radio.Description>
                    {Threshold.MEDIUM * 100}%
                  </Radio.Description>
                </Radio>
                <Radio value={Threshold.HIGH}>
                  High
                  <Radio.Description>{Threshold.HIGH * 100}%</Radio.Description>
                </Radio>
                <Radio value={Threshold.ULTRA}>
                  Ultra
                  <Radio.Description>
                    {Threshold.ULTRA * 100}%
                  </Radio.Description>
                </Radio>
              </Radio.Group>
            </div>
          )) ||
          (setting === "password" && (
            <div className={styles.OptionContent}>
              <Spacer />
              <Input.Password
                {...passwords.new.bindings}
                placeholder="New password..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") updatePassword();
                }}
              />
              <Spacer />
              <Input.Password
                {...passwords.newAgain.bindings}
                placeholder="New password again..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") updatePassword();
                }}
              />
              <Spacer />
              <Input.Password
                {...passwords.old.bindings}
                placeholder="Old password..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") updatePassword();
                }}
              />
              <Spacer />
              <Button
                style={{ width: "100%", marginTop: ".5em" }}
                onClick={updatePassword}
              >
                Change password
              </Button>
            </div>
          )) ||
          (setting === "fee" && (
            <div className={styles.OptionContent}>
              <p>
                You can create a transaction fee multiplier here, which further
                incentivizes Arweave nodes to pick up your transactions. The
                default is <b>1</b> (no multiplier).
              </p>
              <Spacer />
              <Input
                {...feeMultiplier.bindings}
                placeholder="Fee multiplier"
                onKeyPress={(e) => {
                  if (e.key === "Enter") updateFeeMultiplier();
                }}
              />
              <Spacer />
              <Button
                style={{ width: "100%", marginTop: ".5em" }}
                onClick={updateFeeMultiplier}
              >
                Update
              </Button>
            </div>
          )) ||
          (setting === "config_file" && (
            <div className={styles.OptionContent + " " + styles.ConfigFile}>
              <p style={{ fontWeight: "bold" }}>
                Please read before continuing!
              </p>
              <p>
                ArConnect does not offer cloud syncing wallets and settings for
                security reasons. Your password and wallets never get uploaded
                to the web.
                <br />
                To make seamless transitioning to a new browser easier, we allow
                you to generate a config file that contains your password, your
                settings and your wallets, all encrypted safely. This config
                file can later be used to load all of your data into a new
                browser.
                <br />
                <b>
                  DO NOT SHARE THIS FILE WITH ANYONE AND DO NOT UPLOAD IT
                  ANYWHERE.
                </b>{" "}
                By doing so, you risk losing your funds.
              </p>
              <Button
                style={{ width: "100%", marginTop: ".5em" }}
                onClick={() => {
                  setDownloadWallet(undefined);
                  configFileModal.setVisible(true);
                }}
                type="success"
              >
                I understand; download file
              </Button>
              <Spacer h={1.5} />
              <div className={styles.Wallets}>
                {wallets.map(({ address }, i) => (
                  <div className={styles.Wallet} key={i}>
                    {formatAddress(address)}
                    <span
                      onClick={() => {
                        setDownloadWallet(address);
                        configFileModal.setVisible(true);
                      }}
                    >
                      <DownloadIcon />
                    </span>
                  </div>
                ))}
              </div>
              <Spacer />
            </div>
          ))}
      </div>
      <Modal {...configFileModal.bindings}>
        <Modal.Title>
          {downloadWallet ? "Download wallet" : "Generate config file"}
        </Modal.Title>
        <Modal.Content>
          <Input.Password
            {...configPasswordInput.bindings}
            placeholder="Enter your password to continue..."
            width="100%"
          />
          <p style={{ textAlign: "center", marginBottom: 0 }}>
            <b style={{ display: "block" }}>
              DO NOT SHARE THIS FILE WITH ANYONE!
            </b>
            It will compromise{" "}
            {downloadWallet
              ? `your wallet (${formatAddress(downloadWallet, 8)})`
              : "all of your wallets added to ArConnect"}
            .
          </p>
        </Modal.Content>
        <Modal.Action passive onClick={() => configFileModal.setVisible(false)}>
          Cancel
        </Modal.Action>
        <Modal.Action
          onClick={async () => {
            const password = configPasswordInput.state;
            setGeneratingConfig(true);

            if (!(await checkPassword(password))) {
              setToast({ text: "Invalid password", type: "error" });
              setGeneratingConfig(false);
              return;
            }

            try {
              if (downloadWallet) {
                await downloadSelectedWallet();
              } else {
                await generateConfigFile();
              }
            } catch {}
            setGeneratingConfig(false);
          }}
          loading={generatingConfig}
        >
          Ok
        </Modal.Action>
      </Modal>
    </>
  );
}

interface SettingsItemProps {
  header: string;
  headerText: string;
  confettiEffect?: boolean;
  currSetting: React.SetStateAction<
    | "events" // change to apps
    | "permissions"
    | "currency"
    | "arweave"
    | "arverify"
    | "password"
    | "config_file"
    | "fee"
    | undefined
  >;
}
export interface ArConnectEvent {
  event: MessageType;
  url: string;
  date: number;
}
