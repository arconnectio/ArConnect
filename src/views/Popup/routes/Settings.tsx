import React, { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XIcon
} from "@primer/octicons-react";
import { Button, Input, Spacer, useInput } from "@geist-ui/react";
import { goTo } from "react-chrome-extension-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import { getRealURL } from "../../../utils/url";
import {
  readdAsset,
  removePermissions,
  unblockURL,
  blockURL,
  updateArweaveConfig
} from "../../../stores/actions";
import Home from "./Home";
import SubPageTopStyles from "../../../styles/components/SubPageTop.module.sass";
import styles from "../../../styles/views/Popup/settings.module.sass";

export default function Settings() {
  const [setting, setCurrSetting] = useState<
      "events" | "permissions" | "psts" | "sites" | "arweave"
    >(),
    permissions = useSelector((state: RootState) => state.permissions),
    [opened, setOpened] = useState<{ url: string; opened: boolean }[]>([]),
    dispatch = useDispatch(),
    psts = useSelector((state: RootState) => state.assets),
    currentAddress = useSelector((state: RootState) => state.profile),
    blockedURLs = useSelector((state: RootState) => state.blockedSites),
    addURLInput = useInput(""),
    [events, setEvents] = useState<{ event: string; url: string }[]>([]),
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    arweaveHostInput = useInput(arweaveConfig.host),
    arweavePortInput = useInput(arweaveConfig.port.toString()),
    arweaveProtocolInput = useInput(arweaveConfig.protocol);

  useEffect(() => {
    setOpened(permissions.map(({ url }) => ({ url, opened: false })));
    loadEvents();
    // eslint-disable-next-line
  }, []);

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

  function removedPSTs() {
    return (
      psts
        .find(({ address }) => address === currentAddress)
        ?.assets.filter(({ removed }) => removed) ?? []
    );
  }

  function blockInputUrl() {
    dispatch(blockURL(addURLInput.state));
  }

  function loadEvents() {
    const evs = localStorage.getItem("arweave_events");
    if (!evs) return;
    setEvents(JSON.parse(evs).val);
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

  return (
    <>
      <div className={SubPageTopStyles.Head}>
        <div
          className={SubPageTopStyles.Back}
          onClick={() => {
            if (setting) setCurrSetting(undefined);
            else goTo(Home);
          }}
        >
          <ArrowLeftIcon />
        </div>
        <h1>
          {(setting === "events" && "Events") ||
            (setting === "permissions" && "Permissions") ||
            (setting === "psts" && "Removed PSTs") ||
            (setting === "sites" && "Blocked sites") ||
            (setting === "arweave" && "Arweave config") ||
            "Settings"}
        </h1>
      </div>
      <div className={styles.Settings}>
        {(!setting && (
          <>
            <div
              className={styles.Setting}
              onClick={() => setCurrSetting("events")}
            >
              <div>
                <h1>Events</h1>
                <p>View security events</p>
              </div>
              <div className={styles.Arrow}>
                <ChevronRightIcon />
              </div>
            </div>
            <div
              className={styles.Setting}
              onClick={() => setCurrSetting("permissions")}
            >
              <div>
                <h1>Permissions</h1>
                <p>Manage site permissions</p>
              </div>
              <div className={styles.Arrow}>
                <ChevronRightIcon />
              </div>
            </div>
            <div
              className={styles.Setting}
              onClick={() => setCurrSetting("psts")}
            >
              <div>
                <h1>Removed PSTs</h1>
                <p>Manage removed PSTs</p>
              </div>
              <div className={styles.Arrow}>
                <ChevronRightIcon />
              </div>
            </div>
            <div
              className={styles.Setting}
              onClick={() => setCurrSetting("sites")}
            >
              <div>
                <h1>Blocked sites</h1>
                <p>Limit access from sites to WeaveMask</p>
              </div>
              <div className={styles.Arrow}>
                <ChevronRightIcon />
              </div>
            </div>
            <div
              className={styles.Setting}
              onClick={() => setCurrSetting("arweave")}
            >
              <div>
                <h1>Arweave config</h1>
                <p>Edit the arweave config variables</p>
              </div>
              <div className={styles.Arrow}>
                <ChevronRightIcon />
              </div>
            </div>
          </>
        )) ||
          (setting === "permissions" && (
            <>
              {(filterWithPermission().length > 0 &&
                filterWithPermission().map((permissionGroup, i) => (
                  <div key={i}>
                    <div
                      className={styles.Setting + " " + styles.SubSetting}
                      onClick={() => open(permissionGroup.url)}
                    >
                      <h1>{permissionGroup.url}</h1>
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
                              onClick={() =>
                                dispatch(
                                  removePermissions(permissionGroup.url, [perm])
                                )
                              }
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
          (setting === "psts" && (
            <>
              {(removedPSTs().length > 0 &&
                removedPSTs().map((pst, i) => (
                  <div
                    className={styles.Setting + " " + styles.SubSetting}
                    key={i}
                  >
                    <h1>
                      {pst.name} ({pst.ticker})
                    </h1>
                    <div
                      className={styles.Arrow}
                      onClick={() =>
                        dispatch(readdAsset(currentAddress, pst.id))
                      }
                    >
                      <XIcon />
                    </div>
                  </div>
                ))) || <p>No removed PSTs</p>}
            </>
          )) ||
          (setting === "sites" && (
            <>
              {blockedURLs.length > 0 &&
                blockedURLs.map((url, i) => (
                  <div
                    className={styles.Setting + " " + styles.SubSetting}
                    key={i}
                  >
                    <h1>{url}</h1>
                    <div
                      className={styles.Arrow}
                      onClick={() => dispatch(unblockURL(url))}
                    >
                      <XIcon />
                    </div>
                  </div>
                ))}
              <div className={styles.OptionContent}>
                <Input
                  {...addURLInput.bindings}
                  placeholder="Enter url (site.com)..."
                />
                <Button
                  style={{ width: "100%", marginTop: ".5em" }}
                  onClick={blockInputUrl}
                >
                  Block url
                </Button>
              </div>
            </>
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
                    className={styles.Setting + " " + styles.SubSetting}
                    key={i}
                  >
                    <h1>{event.event}</h1>
                    <p>{getRealURL(event.url)}</p>
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
                status={arweaveHostInput.state === "" ? "error" : "default"}
              />
              <Spacer />
              <Input
                {...arweavePortInput.bindings}
                placeholder="Port..."
                type="number"
                status={arweavePortInput.state === "" ? "error" : "default"}
              />
              <Spacer />
              <Input
                {...arweaveProtocolInput.bindings}
                placeholder="Protocol..."
                status={arweaveProtocolInput.state === "" ? "error" : "default"}
              />
              <Spacer />
              <Button
                style={{ width: "100%", marginTop: ".5em" }}
                onClick={updateConfig}
              >
                Set config
              </Button>
            </div>
          ))}
      </div>
    </>
  );
}
