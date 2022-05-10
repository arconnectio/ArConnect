import React, { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  XIcon
} from "@primer/octicons-react";
import {
  Modal,
  Radio,
  useInput,
  useModal,
  Tabs,
  useToasts
} from "@geist-ui/react";
import { Spacer, Input, Button, Checkbox, Select } from "@verto/ui";
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
  updateAppGateway,
  resetArweaveConfig,
  updateTheme
} from "../../../stores/actions";
import { suggestedGateways, SuggestedGateway } from "../../../utils/gateways";
import { IGatewayConfig } from "../../../stores/reducers/arweave";
import { getActiveTab } from "../../../utils/background";
import CryptoES from "crypto-es";
import dayjs from "dayjs";
import Arweave from "arweave";
import axios from "axios";
import styles from "../../../styles/views/Popup/settings.module.sass";
import WalletManager from "../../../components/WalletManager";

export default function Settings({
  initialSetting
}: {
  initialSetting?: SettingTypes;
}) {
  const [setting, setCurrSetting] = useState<SettingTypes | undefined>(
      initialSetting
    ),
    [, setToast] = useToasts(),
    configFileModal = useModal(),
    configPasswordInput = useInput(""),
    [generatingConfig, setGeneratingConfig] = useState(false),
    wallets = useSelector((state: RootState) => state.wallets),
    [downloadWallet, setDownloadWallet] = useState<string>();

  const dispatch = useDispatch();

  const permissions = useSelector((state: RootState) => state.permissions);
  const [opened, setOpened] = useState<{ url: string; opened: boolean }[]>([]);

  const otherSettings = useSelector((state: RootState) => state.settings);
  const feeMultiplier = useInput(
    (otherSettings?.feeMultiplier || 1).toString()
  );

  useEffect(() => {
    setOpened(permissions.map(({ url }) => ({ url, opened: false })));
    loadEvents();

    if (!otherSettings?.feeMultiplier)
      dispatch(updateSettings({ feeMultiplier: 1 }));
    // eslint-disable-next-line
  }, []);

  const gatewayConfig = useSelector((state: RootState) => state.arweave);
  const [arweave, setArweave] = useState<Arweave>(new Arweave(gatewayConfig));

  const arweaveHostInput = useInput("");
  const arweavePortInput = useInput("0");
  const arweaveProtocolInput = useInput("");

  // update instance & inputs on config changes
  useEffect(() => {
    setArweave(new Arweave(gatewayConfig));

    arweaveHostInput.setState(gatewayConfig.host);
    arweavePortInput.setState(gatewayConfig.port.toString());
    arweaveProtocolInput.setState(gatewayConfig.protocol);
    // eslint-disable-next-line
  }, [gatewayConfig]);

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

  const addURLInput = useInput("");

  const [events, setEvents] = useState<ArConnectEvent[]>([]);

  function loadEvents() {
    const evs = localStorage.getItem("arweave_events");
    if (!evs) return;
    setEvents(
      (JSON.parse(evs).val as ArConnectEvent[]).sort((a, b) => b.date - a.date)
    );
  }

  // active tab's URL
  // undefined if the current tab is not connected
  const [activeAppURL, setActiveAppURL] = useState<string>();
  const appGateways = useSelector((state: RootState) => state.gateways);

  useEffect(() => {
    (async () => {
      const res = await getActiveTab();

      if (!res.url) return setActiveAppURL(undefined);

      const url = getRealURL(res.url);

      if (!permissions.find((p) => p.url === url))
        return setActiveAppURL(undefined);

      setActiveAppURL(url);

      const appConfig = appGateways.find((g) => g.url === url)?.gateway;

      if (appConfig) dispatch(updateArweaveConfig(appConfig));
    })();
  }, []);

  // confirmation modal
  const gatewayForAppModal = useModal();
  const [gatewayToConfig, setGatewayToConfig] = useState<IGatewayConfig>();

  /**
   * Update gateway config
   *
   * @param config Gateway config
   * @param currentApp Update config for the current app?
   */
  async function updateGatewayConfig(
    config: IGatewayConfig,
    currentApp = false
  ) {
    // update global config
    dispatch(updateArweaveConfig(config));

    try {
      if (activeAppURL && currentApp) {
        // update config for the current app
        dispatch(
          updateAppGateway({
            url: activeAppURL,
            gateway: config
          })
        );
      }
    } catch {}

    // notify user
    setToast({
      type: "success",
      text: "Gateway updated"
    });
    gatewayForAppModal.setVisible(false);
  }

  const passwords = {
    new: useInput(""),
    newAgain: useInput(""),
    old: useInput("")
  };

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

  const [gateways, setGateways] = useState<Gateway[]>(
    suggestedGateways.map((val) => ({
      ...val,
      status: "pending"
    }))
  );

  useEffect(() => {
    (async () => {
      if (setting !== "gateway") return;

      const gatewaysWithStatuses: Gateway[] = [];

      for (const gateway of suggestedGateways) {
        try {
          const { data, status } = await axios.get<{ network?: string }>(
            `${gateway.protocol}://${gateway.host}:${gateway.port}`
          );

          if (status !== 200) throw new Error();

          gatewaysWithStatuses.push({
            ...gateway,
            status: "online",
            note: data?.network?.includes("arlocal")
              ? "TESTNET"
              : gateway.note ?? undefined
          });
        } catch {
          gatewaysWithStatuses.push({ ...gateway, status: "offline" });
        }
      }

      setGateways(gatewaysWithStatuses);
    })();
  }, [setting]);

  const SettingsItem = ({
    header,
    headerText,
    currSetting,
    children
  }: SettingsItemProps) => (
    <div
      className={styles.Setting}
      onClick={() => {
        if (!children && currSetting) setCurrSetting(currSetting);
      }}
    >
      <div>
        <h1>{header}</h1>
        <p>{headerText}</p>
      </div>
      <div className={styles.Arrow}>
        {children || <ChevronRightIcon size={18} />}
      </div>
    </div>
  );

  const theme = useSelector((state: RootState) => state.theme);

  return (
    <>
      <WalletManager
        pageTitle={
          (setting === "events" && "Events") ||
          (setting === "permissions" && "Permissions") ||
          (setting === "password" && "Password") ||
          (setting === "currency" && "Currency") ||
          (setting === "gateway" && "Gateway Config") ||
          (setting === "arverify" && "ArVerify Config") ||
          (setting === "config_file" && "Download Config") ||
          (setting === "fee" && "Fee multiplier") ||
          "Settings"
        }
        backAction={
          (setting &&
            (() => {
              setCurrSetting(undefined);
              clearInputs();
            })) ||
          undefined
        }
      />

      <div className={styles.Settings}>
        {(!setting && (
          <>
            <SettingsItem
              header="Events"
              currSetting="events"
              headerText="View security events"
            />

            <SettingsItem header="Theme" headerText="Set display theme">
              <Select
                small
                //@ts-ignore
                onChange={(ev) => dispatch(updateTheme(ev.target.value))}
                // @ts-ignore
                value={theme}
                className={styles.NoramlizeVertoComponent}
              >
                <option value="Auto">Auto</option>
                <option value="Dark">Dark</option>
                <option value="Light">Light</option>
              </Select>
            </SettingsItem>

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
              header="Gateway Config"
              currSetting="gateway"
              headerText="Update Arweave gateway config"
            />

            <SettingsItem
              header="ArVerify Config"
              currSetting="arverify"
              headerText="Set the verification threshold"
            />

            <SettingsItem
              header="Confetti effect"
              headerText="Show confetti animation on transaction signing"
            >
              <Checkbox
                checked={otherSettings.arConfetti}
                onChange={(e) =>
                  dispatch(updateSettings({ arConfetti: e.target.checked }))
                }
              />
            </SettingsItem>

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
          (setting === "gateway" && (
            <div className={styles.OptionContent}>
              <Tabs initialValue="1" className={styles.Tabs}>
                <Tabs.Item label="Suggested" value="1">
                  <Spacer />
                  {gateways.map((gateway, i) => (
                    <div key={i}>
                      <div
                        className={
                          styles.Gateway +
                            " " +
                            (gateway.status === "online" && styles.Active) ||
                          (gateway.status === "offline" && styles.Inactive) ||
                          (gateway.status === "pending" && styles.Pending) ||
                          ""
                        }
                        onClick={() => {
                          const config: IGatewayConfig = {
                            host: gateway.host,
                            port: gateway.port,
                            protocol: gateway.protocol
                          };
                          if (activeAppURL) {
                            setGatewayToConfig(config);
                            gatewayForAppModal.setVisible(true);
                          } else {
                            updateGatewayConfig(config);
                          }
                        }}
                      >
                        <h1>
                          {gateway.host}
                          {gatewayConfig.host === gateway.host && (
                            <span className={styles.Selected}>Selected</span>
                          )}
                        </h1>
                        <h2>
                          :{gateway.port} {gateway.note && `(${gateway.note})`}
                        </h2>
                        <h3>
                          Status: {gateway.status}
                          <span className={styles.Status} />
                        </h3>
                      </div>
                      <Spacer />
                    </div>
                  ))}
                </Tabs.Item>
                <Tabs.Item label="Custom" value="2">
                  <Spacer />
                  <Input
                    {...arweaveHostInput.bindings}
                    placeholder="Host..."
                    status={arweaveHostInput.state === "" ? "error" : undefined}
                  />
                  <Spacer />
                  <Input
                    {...arweavePortInput.bindings}
                    placeholder="Port..."
                    type="number"
                    status={arweavePortInput.state === "" ? "error" : undefined}
                  />
                  <Spacer />
                  <Input
                    {...arweaveProtocolInput.bindings}
                    placeholder="Protocol..."
                    status={
                      arweaveProtocolInput.state === "" ? "error" : undefined
                    }
                  />
                  <Spacer />
                  <Button
                    style={{ width: "100%", marginTop: ".5em" }}
                    onClick={() => {
                      if (
                        arweaveProtocolInput.state === "" ||
                        arweavePortInput.state === "" ||
                        arweaveHostInput.state === ""
                      )
                        return;

                      const config: IGatewayConfig = {
                        host: arweaveHostInput.state,
                        port: Number(arweavePortInput.state),
                        // @ts-expect-error
                        protocol: arweaveProtocolInput.state
                      };

                      if (activeAppURL) {
                        setGatewayToConfig(config);
                        gatewayForAppModal.setVisible(true);
                      } else {
                        updateGatewayConfig(config);
                      }
                    }}
                  >
                    Set gateway
                  </Button>
                  <Spacer />
                </Tabs.Item>
              </Tabs>
              <Spacer y={1} />
              <Input
                {...arweaveHostInput.bindings}
                placeholder="Host..."
                status={arweaveHostInput.state === "" ? "error" : undefined}
              />
              <Spacer y={1} />
              <Input
                {...arweavePortInput.bindings}
                placeholder="Port..."
                type="number"
                status={arweavePortInput.state === "" ? "error" : undefined}
              />
              <Spacer y={1} />
              <Input
                {...arweaveProtocolInput.bindings}
                placeholder="Protocol..."
                status={arweaveProtocolInput.state === "" ? "error" : undefined}
              />
              <Spacer y={1} />
              <Button
                small
                type="filled"
                style={{ width: "85%", marginTop: ".5em" }}
                // onClick={updateConfig}
              >
                Set config
              </Button>
              <Spacer y={1} />
              <Button
                small
                type="filled"
                style={{ width: "85%", marginTop: ".5em" }}
                onClick={() => {
                  dispatch(resetArweaveConfig());
                  setCurrSetting(undefined);
                }}
              >
                Reset
              </Button>
              <Spacer y={1} />
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
            //  STARTING HERE
            <div className={styles.OptionContent}>
              <Spacer y={1.2} />
              <Input
                small
                type="password"
                {...passwords.old.bindings}
                placeholder="Current password..."
                onKeyPressHandler={(e) => {
                  if (e.key === "Enter") updatePassword();
                }}
              />
              <Spacer y={1.2} />
              <Input
                small
                type="password"
                {...passwords.new.bindings}
                placeholder="New password..."
                onKeyPressHandler={(e) => {
                  if (e.key === "Enter") updatePassword();
                }}
              />
              <Spacer y={1.2} />
              <Input
                small
                type="password"
                {...passwords.newAgain.bindings}
                placeholder="Confirm password..."
                onKeyPressHandler={(e) => {
                  if (e.key === "Enter") updatePassword();
                }}
              />
              <Spacer y={1.2} />
              <Button
                small
                type="filled"
                style={{ width: "85%", marginTop: ".5em" }}
                onClick={updatePassword}
              >
                Change password
              </Button>
              <Spacer y={1.2} />
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
                small
                {...feeMultiplier.bindings}
                placeholder="Fee multiplier"
                onKeyPressHandler={(e) => {
                  if (e.key === "Enter") updateFeeMultiplier();
                }}
              />
              <Spacer y={1.2} />
              <Button
                small
                style={{ width: "85%", marginTop: ".5em" }}
                onClick={updateFeeMultiplier}
              >
                Update
              </Button>
              <Spacer y={1.2} />
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
                small
                type="filled"
                style={{ width: "85%", marginTop: ".5em" }}
                onClick={() => {
                  setDownloadWallet(undefined);
                  configFileModal.setVisible(true);
                }}
                // state="success"
              >
                I understand; download file
              </Button>
              <Spacer y={1.5} />
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
          <Input
            small
            {...configPasswordInput.bindings}
            placeholder="Enter your password to continue..."
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
      <Modal {...gatewayForAppModal.bindings}>
        <Modal.Title>Update gateway</Modal.Title>
        <Modal.Content>
          Would you like to update the gateway for the current app as well?
        </Modal.Content>
        <Modal.Action
          passive
          onClick={() =>
            updateGatewayConfig(gatewayToConfig as IGatewayConfig, true)
          }
        >
          No
        </Modal.Action>
        <Modal.Action
          onClick={() =>
            updateGatewayConfig(gatewayToConfig as IGatewayConfig, true)
          }
        >
          Yes
        </Modal.Action>
      </Modal>
    </>
  );
}

interface SettingsItemProps {
  header: string;
  headerText: string;
  currSetting?: SettingTypes;
  children?: React.ReactNode;
}
export interface ArConnectEvent {
  event: MessageType;
  url: string;
  date: number;
}

interface Gateway extends SuggestedGateway {
  status: "online" | "pending" | "offline";
}

type SettingTypes =
  | "events"
  | "permissions"
  | "currency"
  | "psts"
  | "sites"
  | "gateway"
  | "arverify"
  | "allowances"
  | "about"
  | "password"
  | "config_file"
  | "fee";
