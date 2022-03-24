import React, { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { goTo } from "react-chrome-extension-router";

import { Button, Toggle, Spacer, useToasts } from "@geist-ui/react";

import { browser } from "webextension-polyfill-ts";

import { updateSettings } from "../../../stores/actions";
import { RootState } from "../../../stores/reducers";

import {
  isSocketOpen,
  sendNativeMessage,
  setNativeMessageErrorHandler
} from "../../../utils/websocket";

import styles from "../../../styles/views/Popup/support.module.sass";
import SubPageTopStyles from "../../../styles/components/SubPageTop.module.sass";

import { ArrowLeftIcon } from "@primer/octicons-react";

import Home from "./Home";

export default function Support() {
  const [connectionStatus, setConnectionStatus] = useState<string>();
  const settings = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();
  const [, setToast] = useToasts();

  setNativeMessageErrorHandler(() => {
    setToast({ text: "No connection", type: "error" });
  });

  const getStatus = (): string => {
    if (isSocketOpen()) {
      return "OK, connected";
    } else {
      return "ArConnect desktop app is not detected. Please install and run it.";
    }
  };

  return (
    <>
      <div className={SubPageTopStyles.Head}>
        <div
          className={SubPageTopStyles.Back}
          onClick={() => {
            goTo(Home);
          }}
        >
          <ArrowLeftIcon />
        </div>
        <h1>{"Support"}</h1>
      </div>
      <div className={styles.Support}>
        <p>
          By running{" "}
          <a
            href="#"
            onClick={() => {
              browser.tabs.create({ url: "https://arconnect.io" });
            }}
          >
            ArConnect desktop app
          </a>{" "}
          you`ll be contributing to the Arweave sites you visit the most often
          by sharing your idle processing power.
        </p>
        <div className={styles.Option}>
          <label>Enable support</label>
          <Toggle
            disabled={!isSocketOpen()}
            checked={settings.enableSupport}
            onChange={() => {
              const payload = {
                pause: settings.enableSupport
              };
              sendNativeMessage("compute", payload, (response: any) => {
                const data: string = JSON.stringify(response);
                setToast({ text: data, type: "success" });
                dispatch(
                  updateSettings({ enableSupport: !settings.enableSupport })
                );
              });
            }}
          />
        </div>
        <div className={styles.Option}>
          <label>Status:</label>
          <div className={styles.Status}>{getStatus()}</div>
        </div>
      </div>
    </>
  );
}
