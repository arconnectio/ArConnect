import React, { Component, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Button, Toggle, Spacer, useToasts } from "@geist-ui/react";

import { updateSettings } from "../../../stores/actions";
import { RootState } from "../../../stores/reducers";

import {
  connectToNativeApp,
  isConnectedToNativeApp
} from "../../../utils/native_messaging";
import {
  sendNativeMessage,
  setNativeMessageErrorHandler
} from "../../../utils/websocket";

import styles from "../../../styles/views/Popup/support.module.sass";
import { browser } from "webextension-polyfill-ts";

export default function SupportWidget() {
  const settings = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();
  const [, setToast] = useToasts();

  setNativeMessageErrorHandler(() => {
    setToast({ text: "Connection error", type: "error" });
  });

  return (
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
        you’ll be contributing Arweave tokens to the sites you visit the most
        often.
      </p>
      <div className={styles.Checkbox}>
        <label>Enable support</label>
        <Toggle
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
    </div>
  );
}
