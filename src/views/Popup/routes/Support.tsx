import React, { useEffect, useState } from "react";
import { goTo } from "react-chrome-extension-router";

import { Spacer, Tooltip, useToasts } from "@geist-ui/react";
import { ArrowLeftIcon } from "@primer/octicons-react";

import { browser } from "webextension-polyfill-ts";

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
  const [, setToast] = useToasts();

  const updateStatus = () => {
    if (!isSocketOpened()) {
      setConnectionStatus(
        "ArConnect desktop app isn`t running. Please install it and launch."
      );
      return;
    }

    sendNativeMessage("compute", {}, (response: any) => {
      try {
        const status: string = response.state == "on" ? "active" : "paused";
        setConnectionStatus(`Contribution is ${status}.`);
      } catch (error) {
        setConnectionStatus("Support is disabled.");
      }
    });
  };

  setNativeMessageErrorHandler(() => {
    updateStatus();
  });

  useEffect((): void => {
    updateStatus();
  }, []);

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
              browser.tabs.create({
                url: "https://dl.dropboxusercontent.com/s/jlohhtgjafb3mj5/ArConnectInstaller.exe?dl=0"
              });
            }}
          >
            ArConnect desktop app
          </a>{" "}
          you`ll be contributing to the Arweave sites you visit the most often
          by sharing your idle processing power.
        </p>
        <Spacer></Spacer>
        <div className={styles.Option}>
          <label>Status:</label>
          <Tooltip text="Click to refresh the status">
            <div
              className={styles.Status}
              onClick={() => {
                updateStatus();
              }}
            >
              {connectionStatus}
            </div>
          </Tooltip>
        </div>
        <Spacer></Spacer>
      </div>
    </>
  );
}
