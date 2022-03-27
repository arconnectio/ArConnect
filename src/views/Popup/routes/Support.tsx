import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { goTo } from "react-chrome-extension-router";

import { Button, Toggle, Spacer, useToasts } from "@geist-ui/react";
import { ArrowLeftIcon } from "@primer/octicons-react";

import { browser } from "webextension-polyfill-ts";

import { updateSettings } from "../../../stores/actions";
import { RootState } from "../../../stores/reducers";

import Home from "./Home";

import {
  isSocketOpened,
  sendNativeMessage,
  setNativeMessageErrorHandler
} from "../../../utils/websocket";

import styles from "../../../styles/views/Popup/support.module.sass";
import SubPageTopStyles from "../../../styles/components/SubPageTop.module.sass";

export default function Support() {
  const [connectionStatus, setConnectionStatus] = useState<string>("Undefined");
  const settings = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();
  const [, setToast] = useToasts();

  setNativeMessageErrorHandler(() => {
    const text: string = "Connection aborted";
    setConnectionStatus(text);
    setToast({ text: text, type: "error" });
  });

  const updateStatus = () => {
    if (!isSocketOpened()) {
      setConnectionStatus(
        "ArConnect desktop app is not detected. Please install it and run."
      );
      return;
    }

    if (!settings.enableSupport) {
      setConnectionStatus("Support is disabled.");
      return;
    }

    sendNativeMessage("compute", {}, (response: any) => {
      try {
        const status: string = response.state == "on" ? "active" : "paused";
        setConnectionStatus(`Contribution is ${status}.`);
      } catch (error) {
        setConnectionStatus("OK, connected.");
      }
    });
  };

  useEffect((): void => {
    updateStatus();
  }, []);

  useEffect((): void => {
    updateStatus();
  }, [settings.enableSupport]);

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
            disabled={!isSocketOpened()}
            checked={settings.enableSupport}
            onChange={() => {
              sendNativeMessage("compute", {}, (response: any) => {
                const currentSupportState: boolean = settings.enableSupport;
                const stateText: string = currentSupportState
                  ? "disabled"
                  : "enabled";
                setToast({ text: `Support is ${stateText}`, type: "success" });
                dispatch(
                  updateSettings({ enableSupport: !settings.enableSupport })
                );
              });
            }}
          />
        </div>
        <div className={styles.Option}>
          <label>Status:</label>
          <div className={styles.Status}>{connectionStatus}</div>
        </div>
      </div>
    </>
  );
}
